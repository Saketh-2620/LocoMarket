# Pin bookworm for stable GDAL package names (avoids huge -dev dependency tree).
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    GDAL_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/libgdal.so \
    GEOS_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/libgeos_c.so

# Runtime libs only — no libgdal-dev / gcc (GeoDjango needs .so files, not headers).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gdal-bin \
        libgdal32 \
        libgeos-c1v5 \
        libproj25 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/* /tmp/* /var/tmp/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "daphne -b 0.0.0.0 -p ${PORT} config.asgi:application"]
