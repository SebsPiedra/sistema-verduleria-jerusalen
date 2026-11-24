-- Esquema actual de Verdulería Jerusalén
-- Generado automáticamente desde Neon PostgreSQL.
-- Contiene únicamente estructura: no incluye datos ni credenciales.

BEGIN;
SET client_encoding = 'UTF8';
SET search_path = public, pg_catalog;

CREATE SEQUENCE "public"."categorias_id_categoria_seq"
  AS integer
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START WITH 1
  NO CYCLE;

CREATE SEQUENCE "public"."clientes_id_cliente_seq"
  AS integer
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START WITH 1
  NO CYCLE;

CREATE SEQUENCE "public"."desechos_id_desecho_seq"
  AS integer
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START WITH 1
  NO CYCLE;

CREATE SEQUENCE "public"."detalle_pedidos_id_detalle_pedido_seq"
  AS integer
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START WITH 1
  NO CYCLE;

CREATE SEQUENCE "public"."detalle_pedidos_id_detalle_seq"
  AS bigint
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START WITH 1
  NO CYCLE;

CREATE SEQUENCE "public"."detalle_ventas_id_detalle_seq"
  AS integer
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START WITH 1
  NO CYCLE;

CREATE SEQUENCE "public"."dispositivos_notificacion_id_seq"
  AS bigint
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START WITH 1
  NO CYCLE;

CREATE SEQUENCE "public"."pedidos_id_pedido_seq"
  AS integer
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START WITH 1
  NO CYCLE;

CREATE SEQUENCE "public"."productos_id_producto_seq"
  AS integer
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START WITH 1
  NO CYCLE;

CREATE SEQUENCE "public"."proveedores_id_proveedor_seq"
  AS integer
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START WITH 1
  NO CYCLE;

CREATE SEQUENCE "public"."recuperacion_password_id_recuperacion_seq"
  AS bigint
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START WITH 1
  NO CYCLE;

CREATE SEQUENCE "public"."usuarios_id_seq"
  AS integer
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START WITH 1
  NO CYCLE;

CREATE SEQUENCE "public"."ventas_id_venta_seq"
  AS integer
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START WITH 1
  NO CYCLE;

CREATE TABLE "public"."categorias" (
  "id_categoria" integer DEFAULT nextval('categorias_id_categoria_seq'::regclass) NOT NULL,
  "nombre" character varying(100) NOT NULL,
  "descripcion" text,
  "fecha_creacion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "estado" character varying(20) DEFAULT 'Activo'::character varying
);

CREATE TABLE "public"."clientes" (
  "id_cliente" integer DEFAULT nextval('clientes_id_cliente_seq'::regclass) NOT NULL,
  "nombre" character varying(150) NOT NULL,
  "telefono" character varying(30),
  "email" character varying(150),
  "direccion" text,
  "fecha_creacion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "correo" character varying(255),
  "clave" character varying(255),
  "estado" character varying(20) DEFAULT 'Activo'::character varying,
  "password" character varying(150),
  "fecha_registro" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "public"."configuracion_sistema" (
  "clave" character varying(80) NOT NULL,
  "valor" numeric(14,2) NOT NULL,
  "actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."cortes_mensuales" (
  "id" uuid NOT NULL,
  "periodo" character(7) NOT NULL,
  "creado_por" integer NOT NULL,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL,
  "datos" jsonb NOT NULL
);

CREATE TABLE "public"."desechos" (
  "id_desecho" integer DEFAULT nextval('desechos_id_desecho_seq'::regclass) NOT NULL,
  "id_producto" integer,
  "cantidad" numeric(10,2) NOT NULL,
  "motivo" text,
  "perdida" numeric(10,2) DEFAULT 0,
  "fecha_desecho" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "precio_compra" numeric(10,2) DEFAULT 0,
  "perdida_total" numeric(10,2) DEFAULT 0,
  "observacion" text,
  "producto" character varying(150),
  "estado" character varying(30) DEFAULT 'Registrado'::character varying,
  "nombre_producto" character varying(150)
);

CREATE TABLE "public"."detalle_pedidos" (
  "id_detalle_pedido" integer DEFAULT nextval('detalle_pedidos_id_detalle_seq'::regclass) NOT NULL,
  "id_pedido" integer,
  "id_producto" integer,
  "cantidad" numeric(10,2),
  "precio_unitario" numeric(10,2),
  "subtotal" numeric(10,2),
  "producto" character varying(150),
  "nombre_producto" character varying(150)
);

CREATE TABLE "public"."detalle_ventas" (
  "id_detalle" integer DEFAULT nextval('detalle_ventas_id_detalle_seq'::regclass) NOT NULL,
  "id_venta" integer,
  "id_producto" integer,
  "cantidad" numeric(10,2),
  "precio_unitario" numeric(10,2),
  "subtotal" numeric(10,2),
  "producto" character varying(150),
  "nombre_producto" character varying(150),
  "costo_unitario" numeric(14,4)
);

CREATE TABLE "public"."dispositivos_notificacion" (
  "id" bigint DEFAULT nextval('dispositivos_notificacion_id_seq'::regclass) NOT NULL,
  "token" text NOT NULL,
  "plataforma" character varying(20) NOT NULL,
  "tipo_usuario" character varying(20) NOT NULL,
  "id_usuario" bigint NOT NULL,
  "activo" boolean DEFAULT true NOT NULL,
  "creado_en" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "actualizado_en" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "public"."gastos_mensuales" (
  "id" uuid NOT NULL,
  "fecha" date NOT NULL,
  "concepto" character varying(200) NOT NULL,
  "monto" numeric(14,2) NOT NULL,
  "creado_por" integer NOT NULL,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL,
  "anulado_en" timestamp with time zone,
  "anulado_por" integer
);

CREATE TABLE "public"."pedidos" (
  "id_pedido" integer DEFAULT nextval('pedidos_id_pedido_seq'::regclass) NOT NULL,
  "id_cliente" integer,
  "cliente" character varying(150),
  "telefono" character varying(30),
  "direccion" text,
  "total" numeric(10,2) DEFAULT 0,
  "estado" character varying(50) DEFAULT 'Pendiente'::character varying,
  "fecha_pedido" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "id_venta" integer,
  "metodo_pago" character varying(50) DEFAULT 'Efectivo'::character varying,
  "direccion_entrega" text,
  "observacion" text,
  "inventario_descontado" integer DEFAULT 0,
  "tipo_entrega" character varying(50) DEFAULT 'Entrega'::character varying,
  "subtotal_productos" numeric(14,2) DEFAULT 0 NOT NULL,
  "costo_envio" numeric(14,2) DEFAULT 0 NOT NULL
);

CREATE TABLE "public"."productos" (
  "id_producto" integer DEFAULT nextval('productos_id_producto_seq'::regclass) NOT NULL,
  "nombre" character varying(150) NOT NULL,
  "descripcion" text,
  "id_categoria" integer,
  "id_proveedor" integer,
  "cantidad" numeric(10,2) DEFAULT 0,
  "stock_minimo" numeric(10,2) DEFAULT 0,
  "unidad_medida" character varying(50) DEFAULT 'kg'::character varying,
  "precio_compra" numeric(10,2) DEFAULT 0,
  "precio_venta" numeric(10,2) DEFAULT 0,
  "fecha_vencimiento" date,
  "imagen" text,
  "estado" character varying(50) DEFAULT 'Activo'::character varying,
  "fecha_creacion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "imagen_url" text,
  "stock" integer DEFAULT 0
);

CREATE TABLE "public"."proveedores" (
  "id_proveedor" integer DEFAULT nextval('proveedores_id_proveedor_seq'::regclass) NOT NULL,
  "nombre" character varying(150) NOT NULL,
  "telefono" character varying(30),
  "email" character varying(150),
  "direccion" text,
  "fecha_creacion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "nombre_proveedor" character varying(150),
  "correo" character varying(150),
  "estado" character varying(30) DEFAULT 'Activo'::character varying,
  "fecha_registro" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "public"."recuperacion_password" (
  "id_recuperacion" bigint DEFAULT nextval('recuperacion_password_id_recuperacion_seq'::regclass) NOT NULL,
  "tipo_cuenta" character varying(20) NOT NULL,
  "id_cuenta" bigint NOT NULL,
  "token_hash" character varying(64) NOT NULL,
  "fecha_expiracion" timestamp without time zone NOT NULL,
  "fecha_uso" timestamp without time zone,
  "fecha_creacion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE "public"."usuario_seguridad" (
  "id_usuario" bigint NOT NULL,
  "two_factor_enabled" boolean DEFAULT false NOT NULL,
  "two_factor_secret" text,
  "two_factor_pending_secret" text,
  "recovery_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "es_sandbox" boolean DEFAULT false NOT NULL,
  "actualizado_en" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "otp_hash" character varying(64),
  "otp_expires_at" timestamp without time zone,
  "otp_attempts" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "public"."usuarios" (
  "id" integer DEFAULT nextval('usuarios_id_seq'::regclass) NOT NULL,
  "nombre" character varying(100) NOT NULL,
  "email" character varying(255) NOT NULL,
  "telefono" character varying(20) NOT NULL,
  "password" character varying(255) NOT NULL,
  "fecha_creacion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "correo" character varying(255),
  "clave" character varying(255),
  "rol" character varying(50) DEFAULT 'admin'::character varying
);

CREATE TABLE "public"."ventas" (
  "id_venta" integer DEFAULT nextval('ventas_id_venta_seq'::regclass) NOT NULL,
  "numero_factura" character varying(100),
  "cliente" character varying(150) DEFAULT 'Cliente contado'::character varying,
  "total" numeric(10,2) DEFAULT 0,
  "metodo_pago" character varying(50) DEFAULT 'Efectivo'::character varying,
  "id_usuario" integer,
  "fecha_venta" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "estado" character varying(30) DEFAULT 'Completada'::character varying,
  "id_cliente" integer,
  "observacion" text,
  "subtotal_productos" numeric(14,2) DEFAULT 0 NOT NULL,
  "costo_envio" numeric(14,2) DEFAULT 0 NOT NULL
);

CREATE TABLE "public"."verificacion_acceso" (
  "tipo_cuenta" character varying(20) NOT NULL,
  "id_cuenta" bigint NOT NULL,
  "requiere_verificacion" boolean DEFAULT true NOT NULL,
  "correo_verificado_en" timestamp without time zone,
  "ultimo_acceso" timestamp without time zone,
  "otp_hash" character varying(64),
  "otp_expires_at" timestamp without time zone,
  "otp_attempts" integer DEFAULT 0 NOT NULL,
  "actualizado_en" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY "public"."categorias"
  ADD CONSTRAINT "categorias_pkey" PRIMARY KEY (id_categoria);
ALTER TABLE ONLY "public"."clientes"
  ADD CONSTRAINT "clientes_pkey" PRIMARY KEY (id_cliente);
ALTER TABLE ONLY "public"."configuracion_sistema"
  ADD CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY (clave);
ALTER TABLE ONLY "public"."cortes_mensuales"
  ADD CONSTRAINT "cortes_mensuales_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."desechos"
  ADD CONSTRAINT "desechos_pkey" PRIMARY KEY (id_desecho);
ALTER TABLE ONLY "public"."detalle_pedidos"
  ADD CONSTRAINT "detalle_pedidos_pkey" PRIMARY KEY (id_detalle_pedido);
ALTER TABLE ONLY "public"."detalle_ventas"
  ADD CONSTRAINT "detalle_ventas_pkey" PRIMARY KEY (id_detalle);
ALTER TABLE ONLY "public"."dispositivos_notificacion"
  ADD CONSTRAINT "dispositivos_notificacion_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."gastos_mensuales"
  ADD CONSTRAINT "gastos_mensuales_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."pedidos"
  ADD CONSTRAINT "pedidos_pkey" PRIMARY KEY (id_pedido);
ALTER TABLE ONLY "public"."productos"
  ADD CONSTRAINT "productos_pkey" PRIMARY KEY (id_producto);
ALTER TABLE ONLY "public"."proveedores"
  ADD CONSTRAINT "proveedores_pkey" PRIMARY KEY (id_proveedor);
ALTER TABLE ONLY "public"."recuperacion_password"
  ADD CONSTRAINT "recuperacion_password_pkey" PRIMARY KEY (id_recuperacion);
ALTER TABLE ONLY "public"."usuario_seguridad"
  ADD CONSTRAINT "usuario_seguridad_pkey" PRIMARY KEY (id_usuario);
ALTER TABLE ONLY "public"."usuarios"
  ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "public"."ventas"
  ADD CONSTRAINT "ventas_pkey" PRIMARY KEY (id_venta);
ALTER TABLE ONLY "public"."verificacion_acceso"
  ADD CONSTRAINT "verificacion_acceso_pkey" PRIMARY KEY (tipo_cuenta, id_cuenta);
ALTER TABLE ONLY "public"."dispositivos_notificacion"
  ADD CONSTRAINT "dispositivos_notificacion_token_key" UNIQUE (token);
ALTER TABLE ONLY "public"."recuperacion_password"
  ADD CONSTRAINT "recuperacion_password_token_hash_key" UNIQUE (token_hash);
ALTER TABLE ONLY "public"."usuarios"
  ADD CONSTRAINT "usuarios_email_key" UNIQUE (email);
ALTER TABLE ONLY "public"."clientes"
  ADD CONSTRAINT "clientes_estado_valido" CHECK (estado::text = ANY (ARRAY['Activo'::character varying, 'Inactivo'::character varying]::text[]));
ALTER TABLE ONLY "public"."cortes_mensuales"
  ADD CONSTRAINT "cortes_mensuales_periodo_check" CHECK (periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'::text);
ALTER TABLE ONLY "public"."desechos"
  ADD CONSTRAINT "desechos_valores_validos" CHECK (cantidad > 0::numeric AND precio_compra >= 0::numeric);
ALTER TABLE ONLY "public"."detalle_pedidos"
  ADD CONSTRAINT "detalle_pedidos_valores_validos" CHECK (cantidad > 0::numeric AND precio_unitario >= 0::numeric AND subtotal >= 0::numeric);
ALTER TABLE ONLY "public"."detalle_ventas"
  ADD CONSTRAINT "detalle_ventas_valores_validos" CHECK (cantidad > 0::numeric AND precio_unitario >= 0::numeric AND subtotal >= 0::numeric);
ALTER TABLE ONLY "public"."gastos_mensuales"
  ADD CONSTRAINT "gastos_mensuales_concepto_check" CHECK (length(TRIM(BOTH FROM concepto)) > 0);
ALTER TABLE ONLY "public"."gastos_mensuales"
  ADD CONSTRAINT "gastos_mensuales_monto_check" CHECK (monto > 0::numeric);
ALTER TABLE ONLY "public"."pedidos"
  ADD CONSTRAINT "pedidos_valores_validos" CHECK (total >= 0::numeric AND (metodo_pago::text = ANY (ARRAY['Efectivo'::character varying, 'SINPE Móvil'::character varying, 'Tarjeta'::character varying, 'Transferencia'::character varying]::text[])) AND (estado::text = ANY (ARRAY['Pendiente'::character varying, 'Aceptado'::character varying, 'En preparación'::character varying, 'En entrega'::character varying, 'Entregado'::character varying, 'Rechazado'::character varying, 'Cancelado'::character varying]::text[])));
ALTER TABLE ONLY "public"."productos"
  ADD CONSTRAINT "productos_valores_validos" CHECK (cantidad >= 0::numeric AND stock_minimo >= 0::numeric AND precio_compra >= 0::numeric AND precio_venta >= 0::numeric AND (estado::text = ANY (ARRAY['Activo'::character varying, 'Inactivo'::character varying]::text[])));
ALTER TABLE ONLY "public"."ventas"
  ADD CONSTRAINT "ventas_valores_validos" CHECK (total >= 0::numeric AND (metodo_pago::text = ANY (ARRAY['Efectivo'::character varying, 'SINPE Móvil'::character varying, 'Tarjeta'::character varying, 'Transferencia'::character varying]::text[])) AND (estado::text = ANY (ARRAY['Completada'::character varying, 'Cancelada'::character varying]::text[])));
ALTER TABLE ONLY "public"."cortes_mensuales"
  ADD CONSTRAINT "cortes_mensuales_creado_por_fkey" FOREIGN KEY (creado_por) REFERENCES usuarios(id);
ALTER TABLE ONLY "public"."desechos"
  ADD CONSTRAINT "desechos_id_producto_fkey" FOREIGN KEY (id_producto) REFERENCES productos(id_producto);
ALTER TABLE ONLY "public"."detalle_pedidos"
  ADD CONSTRAINT "detalle_pedidos_id_pedido_fkey" FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."detalle_pedidos"
  ADD CONSTRAINT "detalle_pedidos_id_producto_fkey" FOREIGN KEY (id_producto) REFERENCES productos(id_producto);
ALTER TABLE ONLY "public"."detalle_ventas"
  ADD CONSTRAINT "detalle_ventas_id_producto_fkey" FOREIGN KEY (id_producto) REFERENCES productos(id_producto);
ALTER TABLE ONLY "public"."detalle_ventas"
  ADD CONSTRAINT "detalle_ventas_id_venta_fkey" FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."gastos_mensuales"
  ADD CONSTRAINT "gastos_mensuales_anulado_por_fkey" FOREIGN KEY (anulado_por) REFERENCES usuarios(id);
ALTER TABLE ONLY "public"."gastos_mensuales"
  ADD CONSTRAINT "gastos_mensuales_creado_por_fkey" FOREIGN KEY (creado_por) REFERENCES usuarios(id);
ALTER TABLE ONLY "public"."productos"
  ADD CONSTRAINT "productos_id_categoria_fkey" FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria);
ALTER TABLE ONLY "public"."productos"
  ADD CONSTRAINT "productos_id_proveedor_fkey" FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor);
ALTER TABLE ONLY "public"."usuario_seguridad"
  ADD CONSTRAINT "usuario_seguridad_id_usuario_fkey" FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."categorias"
  ADD CONSTRAINT "categorias_id_categoria_not_null" NOT NULL id_categoria;
ALTER TABLE ONLY "public"."categorias"
  ADD CONSTRAINT "categorias_nombre_not_null" NOT NULL nombre;
ALTER TABLE ONLY "public"."clientes"
  ADD CONSTRAINT "clientes_id_cliente_not_null" NOT NULL id_cliente;
ALTER TABLE ONLY "public"."clientes"
  ADD CONSTRAINT "clientes_nombre_not_null" NOT NULL nombre;
ALTER TABLE ONLY "public"."configuracion_sistema"
  ADD CONSTRAINT "configuracion_sistema_actualizado_en_not_null" NOT NULL actualizado_en;
ALTER TABLE ONLY "public"."configuracion_sistema"
  ADD CONSTRAINT "configuracion_sistema_clave_not_null" NOT NULL clave;
ALTER TABLE ONLY "public"."configuracion_sistema"
  ADD CONSTRAINT "configuracion_sistema_valor_not_null" NOT NULL valor;
ALTER TABLE ONLY "public"."cortes_mensuales"
  ADD CONSTRAINT "cortes_mensuales_creado_en_not_null" NOT NULL creado_en;
ALTER TABLE ONLY "public"."cortes_mensuales"
  ADD CONSTRAINT "cortes_mensuales_creado_por_not_null" NOT NULL creado_por;
ALTER TABLE ONLY "public"."cortes_mensuales"
  ADD CONSTRAINT "cortes_mensuales_datos_not_null" NOT NULL datos;
ALTER TABLE ONLY "public"."cortes_mensuales"
  ADD CONSTRAINT "cortes_mensuales_id_not_null" NOT NULL id;
ALTER TABLE ONLY "public"."cortes_mensuales"
  ADD CONSTRAINT "cortes_mensuales_periodo_not_null" NOT NULL periodo;
ALTER TABLE ONLY "public"."desechos"
  ADD CONSTRAINT "desechos_cantidad_not_null" NOT NULL cantidad;
ALTER TABLE ONLY "public"."desechos"
  ADD CONSTRAINT "desechos_id_desecho_not_null" NOT NULL id_desecho;
ALTER TABLE ONLY "public"."detalle_pedidos"
  ADD CONSTRAINT "detalle_pedidos_id_detalle_pedido_not_null" NOT NULL id_detalle_pedido;
ALTER TABLE ONLY "public"."detalle_ventas"
  ADD CONSTRAINT "detalle_ventas_id_detalle_not_null" NOT NULL id_detalle;
ALTER TABLE ONLY "public"."dispositivos_notificacion"
  ADD CONSTRAINT "dispositivos_notificacion_activo_not_null" NOT NULL activo;
ALTER TABLE ONLY "public"."dispositivos_notificacion"
  ADD CONSTRAINT "dispositivos_notificacion_actualizado_en_not_null" NOT NULL actualizado_en;
ALTER TABLE ONLY "public"."dispositivos_notificacion"
  ADD CONSTRAINT "dispositivos_notificacion_creado_en_not_null" NOT NULL creado_en;
ALTER TABLE ONLY "public"."dispositivos_notificacion"
  ADD CONSTRAINT "dispositivos_notificacion_id_not_null" NOT NULL id;
ALTER TABLE ONLY "public"."dispositivos_notificacion"
  ADD CONSTRAINT "dispositivos_notificacion_id_usuario_not_null" NOT NULL id_usuario;
ALTER TABLE ONLY "public"."dispositivos_notificacion"
  ADD CONSTRAINT "dispositivos_notificacion_plataforma_not_null" NOT NULL plataforma;
ALTER TABLE ONLY "public"."dispositivos_notificacion"
  ADD CONSTRAINT "dispositivos_notificacion_tipo_usuario_not_null" NOT NULL tipo_usuario;
ALTER TABLE ONLY "public"."dispositivos_notificacion"
  ADD CONSTRAINT "dispositivos_notificacion_token_not_null" NOT NULL token;
ALTER TABLE ONLY "public"."gastos_mensuales"
  ADD CONSTRAINT "gastos_mensuales_concepto_not_null" NOT NULL concepto;
ALTER TABLE ONLY "public"."gastos_mensuales"
  ADD CONSTRAINT "gastos_mensuales_creado_en_not_null" NOT NULL creado_en;
ALTER TABLE ONLY "public"."gastos_mensuales"
  ADD CONSTRAINT "gastos_mensuales_creado_por_not_null" NOT NULL creado_por;
ALTER TABLE ONLY "public"."gastos_mensuales"
  ADD CONSTRAINT "gastos_mensuales_fecha_not_null" NOT NULL fecha;
ALTER TABLE ONLY "public"."gastos_mensuales"
  ADD CONSTRAINT "gastos_mensuales_id_not_null" NOT NULL id;
ALTER TABLE ONLY "public"."gastos_mensuales"
  ADD CONSTRAINT "gastos_mensuales_monto_not_null" NOT NULL monto;
ALTER TABLE ONLY "public"."pedidos"
  ADD CONSTRAINT "pedidos_costo_envio_not_null" NOT NULL costo_envio;
ALTER TABLE ONLY "public"."pedidos"
  ADD CONSTRAINT "pedidos_id_pedido_not_null" NOT NULL id_pedido;
ALTER TABLE ONLY "public"."pedidos"
  ADD CONSTRAINT "pedidos_subtotal_productos_not_null" NOT NULL subtotal_productos;
ALTER TABLE ONLY "public"."productos"
  ADD CONSTRAINT "productos_id_producto_not_null" NOT NULL id_producto;
ALTER TABLE ONLY "public"."productos"
  ADD CONSTRAINT "productos_nombre_not_null" NOT NULL nombre;
ALTER TABLE ONLY "public"."proveedores"
  ADD CONSTRAINT "proveedores_id_proveedor_not_null" NOT NULL id_proveedor;
ALTER TABLE ONLY "public"."proveedores"
  ADD CONSTRAINT "proveedores_nombre_not_null" NOT NULL nombre;
ALTER TABLE ONLY "public"."recuperacion_password"
  ADD CONSTRAINT "recuperacion_password_fecha_creacion_not_null" NOT NULL fecha_creacion;
ALTER TABLE ONLY "public"."recuperacion_password"
  ADD CONSTRAINT "recuperacion_password_fecha_expiracion_not_null" NOT NULL fecha_expiracion;
ALTER TABLE ONLY "public"."recuperacion_password"
  ADD CONSTRAINT "recuperacion_password_id_cuenta_not_null" NOT NULL id_cuenta;
ALTER TABLE ONLY "public"."recuperacion_password"
  ADD CONSTRAINT "recuperacion_password_id_recuperacion_not_null" NOT NULL id_recuperacion;
ALTER TABLE ONLY "public"."recuperacion_password"
  ADD CONSTRAINT "recuperacion_password_tipo_cuenta_not_null" NOT NULL tipo_cuenta;
ALTER TABLE ONLY "public"."recuperacion_password"
  ADD CONSTRAINT "recuperacion_password_token_hash_not_null" NOT NULL token_hash;
ALTER TABLE ONLY "public"."usuario_seguridad"
  ADD CONSTRAINT "usuario_seguridad_actualizado_en_not_null" NOT NULL actualizado_en;
ALTER TABLE ONLY "public"."usuario_seguridad"
  ADD CONSTRAINT "usuario_seguridad_es_sandbox_not_null" NOT NULL es_sandbox;
ALTER TABLE ONLY "public"."usuario_seguridad"
  ADD CONSTRAINT "usuario_seguridad_id_usuario_not_null" NOT NULL id_usuario;
ALTER TABLE ONLY "public"."usuario_seguridad"
  ADD CONSTRAINT "usuario_seguridad_otp_attempts_not_null" NOT NULL otp_attempts;
ALTER TABLE ONLY "public"."usuario_seguridad"
  ADD CONSTRAINT "usuario_seguridad_recovery_codes_not_null" NOT NULL recovery_codes;
ALTER TABLE ONLY "public"."usuario_seguridad"
  ADD CONSTRAINT "usuario_seguridad_two_factor_enabled_not_null" NOT NULL two_factor_enabled;
ALTER TABLE ONLY "public"."usuarios"
  ADD CONSTRAINT "usuarios_email_not_null" NOT NULL email;
ALTER TABLE ONLY "public"."usuarios"
  ADD CONSTRAINT "usuarios_id_not_null" NOT NULL id;
ALTER TABLE ONLY "public"."usuarios"
  ADD CONSTRAINT "usuarios_nombre_not_null" NOT NULL nombre;
ALTER TABLE ONLY "public"."usuarios"
  ADD CONSTRAINT "usuarios_password_not_null" NOT NULL password;
ALTER TABLE ONLY "public"."usuarios"
  ADD CONSTRAINT "usuarios_telefono_not_null" NOT NULL telefono;
ALTER TABLE ONLY "public"."ventas"
  ADD CONSTRAINT "ventas_costo_envio_not_null" NOT NULL costo_envio;
ALTER TABLE ONLY "public"."ventas"
  ADD CONSTRAINT "ventas_id_venta_not_null" NOT NULL id_venta;
ALTER TABLE ONLY "public"."ventas"
  ADD CONSTRAINT "ventas_subtotal_productos_not_null" NOT NULL subtotal_productos;
ALTER TABLE ONLY "public"."verificacion_acceso"
  ADD CONSTRAINT "verificacion_acceso_actualizado_en_not_null" NOT NULL actualizado_en;
ALTER TABLE ONLY "public"."verificacion_acceso"
  ADD CONSTRAINT "verificacion_acceso_id_cuenta_not_null" NOT NULL id_cuenta;
ALTER TABLE ONLY "public"."verificacion_acceso"
  ADD CONSTRAINT "verificacion_acceso_otp_attempts_not_null" NOT NULL otp_attempts;
ALTER TABLE ONLY "public"."verificacion_acceso"
  ADD CONSTRAINT "verificacion_acceso_requiere_verificacion_not_null" NOT NULL requiere_verificacion;
ALTER TABLE ONLY "public"."verificacion_acceso"
  ADD CONSTRAINT "verificacion_acceso_tipo_cuenta_not_null" NOT NULL tipo_cuenta;

CREATE INDEX idx_clientes_correo_normalizado ON public.clientes USING btree (lower((COALESCE(correo, email, ''::character varying))::text));
CREATE INDEX cortes_mensuales_periodo ON public.cortes_mensuales USING btree (periodo, creado_en DESC);
CREATE INDEX idx_detalle_pedidos_pedido_detalle ON public.detalle_pedidos USING btree (id_pedido, id_detalle_pedido);
CREATE INDEX idx_detalle_pedidos_producto ON public.detalle_pedidos USING btree (id_producto);
CREATE INDEX idx_detalle_ventas_producto ON public.detalle_ventas USING btree (id_producto);
CREATE INDEX idx_detalle_ventas_venta_detalle ON public.detalle_ventas USING btree (id_venta, id_detalle);
CREATE INDEX gastos_mensuales_fecha ON public.gastos_mensuales USING btree (fecha);
CREATE INDEX idx_pedidos_cliente_id ON public.pedidos USING btree (id_cliente, id_pedido DESC);
CREATE INDEX idx_pedidos_estado_id ON public.pedidos USING btree (estado, id_pedido DESC);
CREATE INDEX idx_pedidos_fecha_id ON public.pedidos USING btree (fecha_pedido DESC, id_pedido DESC);
CREATE INDEX idx_productos_nombre_normalizado ON public.productos USING btree (lower(TRIM(BOTH FROM nombre)));
CREATE INDEX idx_recuperacion_password_cuenta ON public.recuperacion_password USING btree (tipo_cuenta, id_cuenta);
CREATE INDEX idx_usuario_seguridad_sandbox ON public.usuario_seguridad USING btree (es_sandbox) WHERE (es_sandbox = true);
CREATE INDEX idx_ventas_cliente_id ON public.ventas USING btree (id_cliente, id_venta DESC);
CREATE INDEX idx_ventas_fecha_id ON public.ventas USING btree (fecha_venta DESC, id_venta DESC);

COMMIT;
