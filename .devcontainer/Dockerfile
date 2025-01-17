FROM node:22-bookworm
ENV DEBIAN_FRONTEND=nontineractive
USER root
RUN apt-get update && \
    apt-get install -y less vim && \
    apt-get clean
RUN npm install -g nodemon
USER node
ENV NODE_ENV=development