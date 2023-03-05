/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-shadow */
import express, { Application, Response, Request } from 'express';
import format from 'pg-format';
import { ethers, Wallet } from 'ethers';
import * as dotenv from 'dotenv';
import cors from 'cors';

import { getClient, getTestQuery } from './client';
import zkWalletAbi from './abi/zkWalletAbi.json';

dotenv.config();
const privateKey = process.env.PRIVATE_KEY!;
const infuraKey = process.env.INFURA_KEY!;

const rpcUrl = `https://goerli.infura.io/v3/${infuraKey}`;
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const wallet = new Wallet(privateKey, provider);

const zkWalletInterface = new ethers.utils.Interface(zkWalletAbi);

const getWalletByNetwork = (network: 'goerli' | 'scroll' | 'polygonZkEvm') => {
  let provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  if (network === 'scroll') {
    provider = new ethers.providers.JsonRpcProvider(
      'https://alpha-rpc.scroll.io/l2',
      { chainId: 534353, name: 'Scroll' },
    );
  } else if (network === 'polygonZkEvm') {
    provider = new ethers.providers.JsonRpcProvider(
      'https://rpc.public.zkevm-test.net',
      { chainId: 1442, name: 'PolygonZkEvm' },
    );
  }
  return new Wallet(privateKey, provider);
};

const sendExecute = async (
  executorWallet: ethers.Wallet,
  zkWalletAddr: string,
  proofs: Proof[],
  functionInputData: string,
) => {
  const a_s = [];
  const b_s = [];
  const c_s = [];
  const inputs = [];

  for (let i = 0; i < proofs.length; i++) {
    a_s.push(proofs[i].a);
    b_s.push(proofs[i].b);
    c_s.push(proofs[i].c);
    inputs.push(proofs[i].input);
  }
  const inputData = zkWalletInterface.encodeFunctionData('execute', [
    a_s,
    b_s,
    c_s,
    inputs,
    zkWalletAddr,
    functionInputData,
  ]);

  const tx = await executorWallet.sendTransaction({
    to: zkWalletAddr,
    data: inputData,
  });
  return tx;
};

const app: Application = express();
app.use(cors());
app.use(express.json());
const PORT = 3001;

app.get('/', async (_req: Request, res: Response): Promise<void> => {
  const client = await getClient();
  await client.connect();
  const res1 = await client.query(getTestQuery());
  console.log(`res: ${JSON.stringify(res1)}`);

  await client.end();
  res.json({
    number: 1,
  });
});

app.get('/address/:address', async (req: Request, res: Response) => {
  const { address } = req.params;
  const { nonce } = req.query;
  if (nonce === null || nonce === undefined) {
    res.sendStatus(404);
  }

  const client = await getClient();
  await client.connect();

  const queryRes = await client.query(
    format(
      `Select id, target_wallet, proof, wallet_nonce
              from main.proof_storage
              where target_wallet = %L
              and wallet_nonce = %L`,
      address,
      nonce,
    ),
  );
  await client.end();
  console.log(`queryRes: ${JSON.stringify(queryRes)}`);

  if (!queryRes || queryRes.rowCount === 0) {
    return res.sendStatus(204);
  }

  const result = [];

  for (let i = 0; i < queryRes.rowCount; i++) {
    result.push({
      id: queryRes.rows[i].id,
      zkWallet: queryRes.rows[i].target_wallet,
      proof: queryRes.rows[i].proof,
      walletNonce: queryRes.rows[i].wallet_nonce,
    });
  }

  return res.json(result);
});

app.post('/', async (req: Request, res: Response) => {
  const data = req.body;
  const targetWallet = data.zkWallet;
  const { proof } = data;
  const { walletNonce } = data;

  const client = await getClient();
  await client.connect();

  await client.query(
    format(
      `insert into main.proof_storage
          (target_wallet, proof, wallet_nonce)
          VALUES (%L);
      `,
      [targetWallet, proof, walletNonce],
    ),
  );

  await client.end();
  return res.sendStatus(200);
});

app.delete('/id/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const client = await getClient();
  await client.connect();

  await client.query(
    format(`delete from main.proof_storage where id = %L`, [id]),
  );

  await client.end();
  return res.sendStatus(200);
});

type Proof = {
  a: any;
  b: any;
  c: any;
  input: any;
};

const bytecode =
  '0x60806040523480156200001157600080fd5b5060405162002a9038038062002a90833981810160405281019062000037919062000286565b81815110156200004657600080fd5b8160018190555060005b8151811015620000b957600160026000848481518110620000765762000075620002ec565b5b6020026020010151815260200190815260200160002060006101000a81548160ff0219169083151502179055508080620000b0906200034a565b91505062000050565b50505062000397565b6000604051905090565b600080fd5b600080fd5b6000819050919050565b620000eb81620000d6565b8114620000f757600080fd5b50565b6000815190506200010b81620000e0565b92915050565b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b620001618262000116565b810181811067ffffffffffffffff8211171562000183576200018262000127565b5b80604052505050565b600062000198620000c2565b9050620001a6828262000156565b919050565b600067ffffffffffffffff821115620001c957620001c862000127565b5b602082029050602081019050919050565b600080fd5b6000620001f6620001f084620001ab565b6200018c565b905080838252602082019050602084028301858111156200021c576200021b620001da565b5b835b81811015620002495780620002348882620000fa565b8452602084019350506020810190506200021e565b5050509392505050565b600082601f8301126200026b576200026a62000111565b5b81516200027d848260208601620001df565b91505092915050565b60008060408385031215620002a0576200029f620000cc565b5b6000620002b085828601620000fa565b925050602083015167ffffffffffffffff811115620002d457620002d3620000d1565b5b620002e28582860162000253565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006200035782620000d6565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82036200038c576200038b6200031b565b5b600182019050919050565b6126e980620003a76000396000f3fe6080604052600436106100435760003560e01c806342cde4e81461004f578063affed0e01461007a578063eb674966146100a5578063f398789b146100ce5761004a565b3661004a57005b600080fd5b34801561005b57600080fd5b5061006461010b565b604051610071919061190b565b60405180910390f35b34801561008657600080fd5b5061008f610111565b60405161009c919061190b565b60405180910390f35b3480156100b157600080fd5b506100cc60048036038101906100c79190611bea565b610117565b005b3480156100da57600080fd5b506100f560048036038101906100f09190611f55565b6104de565b6040516101029190611fd9565b60405180910390f35b60015481565b60005481565b60015484849050101561012957600080fd5b878790508a8a905014801561014357508585905088889050145b61014c57600080fd5b6000805b600154811015610325576002600087878481811061017157610170611ff4565b5b905060c0020160046006811061018a57610189611ff4565b5b6020020135815260200190815260200160002060009054906101000a900460ff166101b457600080fd5b818686838181106101c8576101c7611ff4565b5b905060c002016004600681106101e1576101e0611ff4565b5b6020020135116101f057600080fd5b60003073ffffffffffffffffffffffffffffffffffffffff1663f398789b8e8e8581811061022157610220611ff4565b5b9050604002018d8d8681811061023a57610239611ff4565b5b9050608002018c8c8781811061025357610252611ff4565b5b9050604002018b8b8881811061026c5761026b611ff4565b5b905060c002016040518563ffffffff1660e01b8152600401610291949392919061210b565b602060405180830381865afa1580156102ae573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102d2919061217e565b90508686838181106102e7576102e6611ff4565b5b905060c00201600460068110610300576102ff611ff4565b5b602002013592508061031157600080fd5b50808061031d906121da565b915050610150565b5060008585600081811061033c5761033b611ff4565b5b905060c0020160006006811061035557610354611ff4565b5b60200201358460405160200161036b9190612231565b6040516020818303038152906040528051906020012060001c1461038e57600080fd5b600160005461039d919061224c565b6000819055508373ffffffffffffffffffffffffffffffffffffffff16868660008181106103ce576103cd611ff4565b5b905060c002016001600681106103e7576103e6611ff4565b5b602002013587876000818110610400576103ff611ff4565b5b905060c0020160026006811061041957610418611ff4565b5b6020020135908888600081811061043357610432611ff4565b5b905060c0020160036006811061044c5761044b611ff4565b5b602002013560405160200161046191906122a1565b60405160208183030381529060405260405161047d919061232d565b600060405180830381858888f193505050503d80600081146104bb576040519150601f19603f3d011682016040523d82523d6000602084013e6104c0565b606091505b505080915050806104d057600080fd5b505050505050505050505050565b60006104e86117b0565b60405180604001604052808760006002811061050757610506611ff4565b5b602002015181526020018760016002811061052557610524611ff4565b5b60200201518152508160000181905250604051806040016040528060405180604001604052808860006002811061055f5761055e611ff4565b5b602002015160006002811061057757610576611ff4565b5b602002015181526020018860006002811061059557610594611ff4565b5b60200201516001600281106105ad576105ac611ff4565b5b602002015181525081526020016040518060400160405280886001600281106105d9576105d8611ff4565b5b60200201516000600281106105f1576105f0611ff4565b5b602002015181526020018860016002811061060f5761060e611ff4565b5b602002015160016002811061062757610626611ff4565b5b6020020151815250815250816020018190525060405180604001604052808560006002811061065957610658611ff4565b5b602002015181526020018560016002811061067757610676611ff4565b5b602002015181525081604001819052506000600667ffffffffffffffff8111156106a4576106a3611abf565b5b6040519080825280602002602001820160405280156106d25781602001602082028036833780820191505090505b50905060005b600681101561072b578481600681106106f4576106f3611ff4565b5b602002015182828151811061070c5761070b611ff4565b5b6020026020010181815250508080610723906121da565b9150506106d8565b5060006107388284610757565b036107485760019250505061074f565b6000925050505b949350505050565b6000807f30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f00000019050600061078761094a565b90508060800151516001865161079d919061224c565b146107dd576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107d4906123a1565b60405180910390fd5b60006040518060400160405280600081526020016000815250905060005b86518110156108cc578387828151811061081857610817611ff4565b5b602002602001015110610860576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108579061240d565b60405180910390fd5b6108b7826108b28560800151600185610879919061224c565b8151811061088a57610889611ff4565b5b60200260200101518a85815181106108a5576108a4611ff4565b5b6020026020010151610fa6565b61107e565b915080806108c4906121da565b9150506107fb565b506108f68183608001516000815181106108e9576108e8611ff4565b5b602002602001015161107e565b905061092c610908866000015161117c565b8660200151846000015185602001518587604001518b604001518960600151611221565b61093c5760019350505050610944565b600093505050505b92915050565b6109526117e3565b60405180604001604052807f2d4d9aa7e302d9df41749d5507949d05dbea33fbb16c643b22f599a2be6df2e281526020017f14bedd503c37ceb061d8ec60209fe345ce89830a19230301f076caff004d19268152508160000181905250604051806040016040528060405180604001604052807f0967032fcbf776d1afc985f88877f182d38480a653f2decaa9794cbc3bf3060c81526020017f0e187847ad4c798374d0d6732bf501847dd68bc0e071241e0213bc7fc13db7ab815250815260200160405180604001604052807f304cfbd1e08a704a99f5e847d93f8c3caafddec46b7a0d379da69a4d112346a781526020017f1739c1b1a457a8c7313123d24d2f9192f896b7c63eea05a9d57f06547ad0cec88152508152508160200181905250604051806040016040528060405180604001604052807f198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c281526020017f1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed815250815260200160405180604001604052807f090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b81526020017f12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa8152508152508160400181905250604051806040016040528060405180604001604052807f14a24116a0be8fbbb53e517ca0cd6e2e8d6401a838b42b06d993e2e0608a0a8f81526020017f17427099bf18a8c813f5e75957ec70aa2800e6de5871af3af215b62f6d9d20cc815250815260200160405180604001604052807f17096b86a9f15ee1dc34cf4803a69fb4ce0e9403b9415551b221ca48a5ba6b9e81526020017f2c36fdc1e22b4574a141924a998d8df7701af3bc3b3d1311162433c7432d116c8152508152508160600181905250600767ffffffffffffffff811115610c1957610c18611abf565b5b604051908082528060200260200182016040528015610c5257816020015b610c3f61182a565b815260200190600190039081610c375790505b50816080018190525060405180604001604052807f0d8a83250f009bad499b38966e5c62b75e7dd333d3f432fa9d5e9de7dc0f351181526020017f2bee3f61e98dc2772097a7428f2fc45f0e3a3f4f053397a813b780bb4854a3078152508160800151600081518110610cc857610cc7611ff4565b5b602002602001018190525060405180604001604052807f2161cfdec9ef40238173f32b8f43b87a70bc38eaa93ebb4a2613cb2cd779cfe781526020017f25efe29d679a72f2309aee9bad46ddd41d72ee8419ba8db47b8ccde36f5828e18152508160800151600181518110610d4057610d3f611ff4565b5b602002602001018190525060405180604001604052807f14eb9b41800c9461359f3f2efb0a84d0f2a22db1fefadc116d3da57e78c4730a81526020017f092ff034479e8e884156967ceff2a746fb7dc69b37bc5ec8b50012160048a2048152508160800151600281518110610db857610db7611ff4565b5b602002602001018190525060405180604001604052807f273060b90937431705d741297b808d67aa7a0ffea72df05976d54e29e1d0b34481526020017f2ec908087b88093b45f84c9340091210c274f9161b4cc5cd35d451eeba2b58758152508160800151600381518110610e3057610e2f611ff4565b5b602002602001018190525060405180604001604052807f2eb228368938bef4860b2ab8734c2de54ee05699365724d7cafe072bce1c7c6381526020017f13d77d2b6164238dcabadf13544ef2d1c9cb04ff86c721ad996fe7880dd152108152508160800151600481518110610ea857610ea7611ff4565b5b602002602001018190525060405180604001604052807f2d3adfd0c2f4a3b9c83b774494649cbbc424e63d721ba642e30add0d039e529581526020017f2d42e94b1351587500b1c3970ab44b68e5b36fccc7c45bc363500525593706678152508160800151600581518110610f2057610f1f611ff4565b5b602002602001018190525060405180604001604052807f122b08c309fa2b39fc695613e804b9e8296d3b9969686ae168c38f549ece160281526020017f23dfb9a86e94f23b20672c3834348652b1e7a240a98657fba15e28931cd242b58152508160800151600681518110610f9857610f97611ff4565b5b602002602001018190525090565b610fae61182a565b610fb6611844565b836000015181600060038110610fcf57610fce611ff4565b5b602002018181525050836020015181600160038110610ff157610ff0611ff4565b5b602002018181525050828160026003811061100f5761100e611ff4565b5b602002018181525050600060608360808460076107d05a03fa9050806000810361103557fe5b5080611076576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161106d90612479565b60405180910390fd5b505092915050565b61108661182a565b61108e611866565b8360000151816000600481106110a7576110a6611ff4565b5b6020020181815250508360200151816001600481106110c9576110c8611ff4565b5b6020020181815250508260000151816002600481106110eb576110ea611ff4565b5b60200201818152505082602001518160036004811061110d5761110c611ff4565b5b602002018181525050600060608360c08460066107d05a03fa9050806000810361113357fe5b5080611174576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161116b906124e5565b60405180910390fd5b505092915050565b61118461182a565b60007f30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd479050600083600001511480156111c1575060008360200151145b156111e557604051806040016040528060008152602001600081525091505061121c565b60405180604001604052808460000151815260200182856020015161120a9190612534565b836112159190612565565b8152509150505b919050565b600080600467ffffffffffffffff81111561123f5761123e611abf565b5b60405190808252806020026020018201604052801561127857816020015b61126561182a565b81526020019060019003908161125d5790505b5090506000600467ffffffffffffffff81111561129857611297611abf565b5b6040519080825280602002602001820160405280156112d157816020015b6112be611888565b8152602001906001900390816112b65790505b5090508a826000815181106112e9576112e8611ff4565b5b6020026020010181905250888260018151811061130957611308611ff4565b5b6020026020010181905250868260028151811061132957611328611ff4565b5b6020026020010181905250848260038151811061134957611348611ff4565b5b6020026020010181905250898160008151811061136957611368611ff4565b5b6020026020010181905250878160018151811061138957611388611ff4565b5b602002602001018190525085816002815181106113a9576113a8611ff4565b5b602002602001018190525083816003815181106113c9576113c8611ff4565b5b60200260200101819052506113de82826113ee565b9250505098975050505050505050565b60008151835114611434576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161142b906125e5565b60405180910390fd5b60008351905060006006826114499190612605565b905060008167ffffffffffffffff81111561146757611466611abf565b5b6040519080825280602002602001820160405280156114955781602001602082028036833780820191505090505b50905060005b8381101561171a578681815181106114b6576114b5611ff4565b5b6020026020010151600001518260006006846114d29190612605565b6114dc919061224c565b815181106114ed576114ec611ff4565b5b60200260200101818152505086818151811061150c5761150b611ff4565b5b6020026020010151602001518260016006846115289190612605565b611532919061224c565b8151811061154357611542611ff4565b5b60200260200101818152505085818151811061156257611561611ff4565b5b60200260200101516000015160006002811061158157611580611ff4565b5b60200201518260026006846115969190612605565b6115a0919061224c565b815181106115b1576115b0611ff4565b5b6020026020010181815250508581815181106115d0576115cf611ff4565b5b6020026020010151600001516001600281106115ef576115ee611ff4565b5b60200201518260036006846116049190612605565b61160e919061224c565b8151811061161f5761161e611ff4565b5b60200260200101818152505085818151811061163e5761163d611ff4565b5b60200260200101516020015160006002811061165d5761165c611ff4565b5b60200201518260046006846116729190612605565b61167c919061224c565b8151811061168d5761168c611ff4565b5b6020026020010181815250508581815181106116ac576116ab611ff4565b5b6020026020010151602001516001600281106116cb576116ca611ff4565b5b60200201518260056006846116e09190612605565b6116ea919061224c565b815181106116fb576116fa611ff4565b5b6020026020010181815250508080611712906121da565b91505061149b565b506117236118ae565b6000602082602086026020860160086107d05a03fa9050806000810361174557fe5b5080611786576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161177d90612693565b60405180910390fd5b60008260006001811061179c5761179b611ff4565b5b602002015114159550505050505092915050565b60405180606001604052806117c361182a565b81526020016117d0611888565b81526020016117dd61182a565b81525090565b6040518060a001604052806117f661182a565b8152602001611803611888565b8152602001611810611888565b815260200161181d611888565b8152602001606081525090565b604051806040016040528060008152602001600081525090565b6040518060600160405280600390602082028036833780820191505090505090565b6040518060800160405280600490602082028036833780820191505090505090565b604051806040016040528061189b6118d0565b81526020016118a86118d0565b81525090565b6040518060200160405280600190602082028036833780820191505090505090565b6040518060400160405280600290602082028036833780820191505090505090565b6000819050919050565b611905816118f2565b82525050565b600060208201905061192060008301846118fc565b92915050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b60008083601f84011261195f5761195e61193a565b5b8235905067ffffffffffffffff81111561197c5761197b61193f565b5b60208301915083604082028301111561199857611997611944565b5b9250929050565b60008083601f8401126119b5576119b461193a565b5b8235905067ffffffffffffffff8111156119d2576119d161193f565b5b6020830191508360808202830111156119ee576119ed611944565b5b9250929050565b60008083601f840112611a0b57611a0a61193a565b5b8235905067ffffffffffffffff811115611a2857611a2761193f565b5b6020830191508360c0820283011115611a4457611a43611944565b5b9250929050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000611a7682611a4b565b9050919050565b611a8681611a6b565b8114611a9157600080fd5b50565b600081359050611aa381611a7d565b92915050565b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b611af782611aae565b810181811067ffffffffffffffff82111715611b1657611b15611abf565b5b80604052505050565b6000611b29611926565b9050611b358282611aee565b919050565b600067ffffffffffffffff821115611b5557611b54611abf565b5b611b5e82611aae565b9050602081019050919050565b82818337600083830152505050565b6000611b8d611b8884611b3a565b611b1f565b905082815260208101848484011115611ba957611ba8611aa9565b5b611bb4848285611b6b565b509392505050565b600082601f830112611bd157611bd061193a565b5b8135611be1848260208601611b7a565b91505092915050565b60008060008060008060008060008060c08b8d031215611c0d57611c0c611930565b5b60008b013567ffffffffffffffff811115611c2b57611c2a611935565b5b611c378d828e01611949565b9a509a505060208b013567ffffffffffffffff811115611c5a57611c59611935565b5b611c668d828e0161199f565b985098505060408b013567ffffffffffffffff811115611c8957611c88611935565b5b611c958d828e01611949565b965096505060608b013567ffffffffffffffff811115611cb857611cb7611935565b5b611cc48d828e016119f5565b94509450506080611cd78d828e01611a94565b92505060a08b013567ffffffffffffffff811115611cf857611cf7611935565b5b611d048d828e01611bbc565b9150509295989b9194979a5092959850565b600067ffffffffffffffff821115611d3157611d30611abf565b5b602082029050919050565b611d45816118f2565b8114611d5057600080fd5b50565b600081359050611d6281611d3c565b92915050565b6000611d7b611d7684611d16565b611b1f565b90508060208402830185811115611d9557611d94611944565b5b835b81811015611dbe5780611daa8882611d53565b845260208401935050602081019050611d97565b5050509392505050565b600082601f830112611ddd57611ddc61193a565b5b6002611dea848285611d68565b91505092915050565b600067ffffffffffffffff821115611e0e57611e0d611abf565b5b602082029050919050565b6000611e2c611e2784611df3565b611b1f565b90508060408402830185811115611e4657611e45611944565b5b835b81811015611e6f5780611e5b8882611dc8565b845260208401935050604081019050611e48565b5050509392505050565b600082601f830112611e8e57611e8d61193a565b5b6002611e9b848285611e19565b91505092915050565b600067ffffffffffffffff821115611ebf57611ebe611abf565b5b602082029050919050565b6000611edd611ed884611ea4565b611b1f565b90508060208402830185811115611ef757611ef6611944565b5b835b81811015611f205780611f0c8882611d53565b845260208401935050602081019050611ef9565b5050509392505050565b600082601f830112611f3f57611f3e61193a565b5b6006611f4c848285611eca565b91505092915050565b6000806000806101c08587031215611f7057611f6f611930565b5b6000611f7e87828801611dc8565b9450506040611f8f87828801611e79565b93505060c0611fa087828801611dc8565b925050610100611fb287828801611f2a565b91505092959194509250565b60008115159050919050565b611fd381611fbe565b82525050565b6000602082019050611fee6000830184611fca565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b82818337505050565b61203860408383612023565b5050565b600060029050919050565b600081905092915050565b6000819050919050565b61206860408383612023565b5050565b6000612078838361205c565b60408301905092915050565b600082905092915050565b6000604082019050919050565b6120a58161203c565b6120af8184612047565b92506120ba82612052565b8060005b838110156120f3576120d08284612084565b6120da878261206c565b96506120e58361208f565b9250506001810190506120be565b505050505050565b61210760c08383612023565b5050565b60006101c082019050612121600083018761202c565b61212e604083018661209c565b61213b60c083018561202c565b6121496101008301846120fb565b95945050505050565b61215b81611fbe565b811461216657600080fd5b50565b60008151905061217881612152565b92915050565b60006020828403121561219457612193611930565b5b60006121a284828501612169565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006121e5826118f2565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203612217576122166121ab565b5b600182019050919050565b61222b81611a6b565b82525050565b60006020820190506122466000830184612222565b92915050565b6000612257826118f2565b9150612262836118f2565b925082820190508082111561227a576122796121ab565b5b92915050565b6000819050919050565b61229b612296826118f2565b612280565b82525050565b60006122ad828461228a565b60208201915081905092915050565b600081519050919050565b600081905092915050565b60005b838110156122f05780820151818401526020810190506122d5565b60008484015250505050565b6000612307826122bc565b61231181856122c7565b93506123218185602086016122d2565b80840191505092915050565b600061233982846122fc565b915081905092915050565b600082825260208201905092915050565b7f76657269666965722d6261642d696e7075740000000000000000000000000000600082015250565b600061238b601283612344565b915061239682612355565b602082019050919050565b600060208201905081810360008301526123ba8161237e565b9050919050565b7f76657269666965722d6774652d736e61726b2d7363616c61722d6669656c6400600082015250565b60006123f7601f83612344565b9150612402826123c1565b602082019050919050565b60006020820190508181036000830152612426816123ea565b9050919050565b7f70616972696e672d6d756c2d6661696c65640000000000000000000000000000600082015250565b6000612463601283612344565b915061246e8261242d565b602082019050919050565b6000602082019050818103600083015261249281612456565b9050919050565b7f70616972696e672d6164642d6661696c65640000000000000000000000000000600082015250565b60006124cf601283612344565b91506124da82612499565b602082019050919050565b600060208201905081810360008301526124fe816124c2565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b600061253f826118f2565b915061254a836118f2565b92508261255a57612559612505565b5b828206905092915050565b6000612570826118f2565b915061257b836118f2565b9250828203905081811115612593576125926121ab565b5b92915050565b7f70616972696e672d6c656e677468732d6661696c656400000000000000000000600082015250565b60006125cf601683612344565b91506125da82612599565b602082019050919050565b600060208201905081810360008301526125fe816125c2565b9050919050565b6000612610826118f2565b915061261b836118f2565b9250828202612629816118f2565b915082820484148315176126405761263f6121ab565b5b5092915050565b7f70616972696e672d6f70636f64652d6661696c65640000000000000000000000600082015250565b600061267d601583612344565b915061268882612647565b602082019050919050565b600060208201905081810360008301526126ac81612670565b905091905056fea26469706673582212202767f2bdc20e5ba224dcdcc19a9d535e03516915dbee8e7e4ba846dfda62d0f864736f6c63430008110033';

app.post('/create', async (req: Request, res: Response) => {
  console.log(req.body);
  const { threshold, ownerHashes, network } = req.body;
  const networkWallet = getWalletByNetwork(network);

  const factory = new ethers.ContractFactory(
    zkWalletAbi,
    bytecode,
    networkWallet,
  );
  const contract = await factory.deploy(threshold, ownerHashes);
  const receipt = await contract.deployTransaction.wait();

  console.log(receipt);
  return res.status(200).json(receipt);
});

app.post('/relay', async (req: Request, res: Response) => {
  const data = req.body;

  const { walletAddress } = data;
  const { proofs } = data;
  const inputData = zkWalletInterface.encodeFunctionData('nonce');

  const tx = await sendExecute(wallet, walletAddress, proofs, inputData);

  return res.status(200).json(tx);
});

app.listen(PORT, (): void => {
  console.log('SERVER IS UP ON PORT:', PORT);
});
