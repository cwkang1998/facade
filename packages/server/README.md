

```
cd src/db

docker build -t eth-denver . && docker run -p 5432:5432 --rm -it eth-denver
```
