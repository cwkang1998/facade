create schema main;

create table main.proof_storage (
    id serial primary key,
    target_wallet TEXT,
    proof TEXT,
    wallet_nonce int not null
)