FROM mongo:7

RUN echo "rs.initiate();" > /docker-entrypoint-initdb.d/init.js

CMD [ "--bind_ip_all", "--replSet", "rs0" ]
