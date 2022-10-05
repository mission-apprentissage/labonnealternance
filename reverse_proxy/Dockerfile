ARG NGINX_VERSION="1.20.2"
FROM nginx:${NGINX_VERSION} as nginxModules

ARG HEADERS_MORE_VERSION="v0.33"

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        automake \
        cmake \
        doxygen \
        g++ \
        git \
        libcurl4-gnutls-dev \
        libgeoip-dev \
        liblua5.3-dev \
        libpcre++-dev \
        libtool \
        libxml2-dev \
        make \
        ruby \
        pkg-config \
        zlib1g-dev; \
     apt-get clean; \
     rm -rf /var/lib/apt/lists/*

WORKDIR /sources

# Build headers-more-nginx-module
RUN set -eux; \
    git clone -b "${HEADERS_MORE_VERSION}" --depth 1 https://github.com/openresty/headers-more-nginx-module; \
    curl -sSL https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz -o nginx-${NGINX_VERSION}.tar.gz; \
    tar -xzf nginx-${NGINX_VERSION}.tar.gz; \
    cd ./nginx-${NGINX_VERSION}; \
    ./configure --with-compat --add-dynamic-module=../headers-more-nginx-module; \
    make modules; \
    strip objs/ngx_http_headers_more_filter_module.so; \
    cp objs/ngx_http_headers_more_filter_module.so /etc/nginx/modules/;


FROM owasp/modsecurity-crs:3.3.2-nginx

RUN apt-get update \
    && apt-get install -y logrotate

COPY --from=nginxModules /etc/nginx/modules/ngx_http_headers_more_filter_module.so /etc/nginx/modules/ngx_http_headers_more_filter_module.so

#Logrotate
COPY app/logrotate.d/logrotate.conf /etc/logrotate.conf
RUN chmod 644 /etc/logrotate.conf

#Nginx
COPY app/nginx /etc/nginx

VOLUME /data
