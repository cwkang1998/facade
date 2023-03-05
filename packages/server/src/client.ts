import { Client } from 'pg';

export const getClient = async () => {
  const client = new Client({
    user: 'docker',
    password: 'docker',
    database: 'eth-denver',
    port: 5432,
  });

  return client;
};

export const getTestQuery = () => {
  return 'SELECT 5';
};
