FROM postgres

COPY 1.schema.sql /docker-entrypoint-initdb.d/

ENV POSTGRES_USER docker
ENV POSTGRES_PASSWORD docker
ENV POSTGRES_DB eth-denver