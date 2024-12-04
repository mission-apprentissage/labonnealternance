FROM mongo:7
COPY ./mongo_keyfile /tmp/mongo_keyfile
COPY ./mongod.conf /etc/mongod.conf
RUN chown mongodb:mongodb /etc/mongod.conf
RUN chown mongodb:mongodb /tmp/mongo_keyfile
RUN chmod 400 /tmp/mongo_keyfile

CMD ["mongod", "--config", "/etc/mongod.conf"]
