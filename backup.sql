--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: _system; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA _system;


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'out_for_delivery',
    'delivered',
    'cancelled'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'customer',
    'restaurant_owner',
    'admin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: replit_database_migrations_v1; Type: TABLE; Schema: _system; Owner: -
--

CREATE TABLE _system.replit_database_migrations_v1 (
    id bigint NOT NULL,
    build_id text NOT NULL,
    deployment_id text NOT NULL,
    statement_count bigint NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE; Schema: _system; Owner: -
--

CREATE SEQUENCE _system.replit_database_migrations_v1_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE OWNED BY; Schema: _system; Owner: -
--

ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNED BY _system.replit_database_migrations_v1.id;


--
-- Name: delivery_buildings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_buildings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    delivery_location_id character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: delivery_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_locations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: lunchboxes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lunchboxes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    image_url text,
    is_available boolean DEFAULT true,
    dietary_tags text[],
    restaurant_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    available_days text[] DEFAULT '{monday,tuesday,wednesday,thursday,friday}'::text[],
    delivery_building_ids character varying[]
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying,
    lunchbox_id character varying,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    customer_id character varying,
    restaurant_id character varying,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    delivery_fee numeric(10,2) NOT NULL,
    service_fee numeric(10,2) NOT NULL,
    tax numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    delivery_location text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    order_number integer NOT NULL,
    delivery_day text NOT NULL,
    delivery_building_id character varying
);


--
-- Name: orders_order_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_order_number_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_order_number_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_order_number_seq OWNED BY public.orders.order_number;


--
-- Name: restaurants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restaurants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    cuisine text NOT NULL,
    image_url text,
    rating numeric(2,1) DEFAULT 0.0,
    delivery_time text,
    delivery_fee numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true,
    owner_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    delivery_location_id character varying
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text,
    role public.user_role DEFAULT 'customer'::public.user_role NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    provider text DEFAULT 'local'::text,
    provider_id text,
    profile_complete boolean DEFAULT true,
    full_name text,
    phone_number text,
    delivery_location_id text
);


--
-- Name: replit_database_migrations_v1 id; Type: DEFAULT; Schema: _system; Owner: -
--

ALTER TABLE ONLY _system.replit_database_migrations_v1 ALTER COLUMN id SET DEFAULT nextval('_system.replit_database_migrations_v1_id_seq'::regclass);


--
-- Name: orders order_number; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_number SET DEFAULT nextval('public.orders_order_number_seq'::regclass);


--
-- Data for Name: replit_database_migrations_v1; Type: TABLE DATA; Schema: _system; Owner: -
--

COPY _system.replit_database_migrations_v1 (id, build_id, deployment_id, statement_count, applied_at) FROM stdin;
1	1d1a676d-7367-4592-86f5-ee698805d9cd	a0b4ae16-4920-4b2b-8539-2bfb2dd3c834	5	2025-10-04 18:15:28.368295+00
\.


--
-- Data for Name: delivery_buildings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.delivery_buildings (id, name, address, delivery_location_id, is_active, created_at) FROM stdin;
704c392f-dea9-40ec-8f92-dd33b3a2a9a2	Amazon Dawson		9a5e35eb-2caf-41dd-af8d-55eb39d06075	t	2025-10-04 22:51:53.215284
e32f11d6-fb45-40a8-b48f-45258d3a8801	Amazon Doppler		9a5e35eb-2caf-41dd-af8d-55eb39d06075	t	2025-10-04 22:52:07.106464
efcfc80a-b472-4f18-a302-40b545f631ab	Amazon Ruby		9a5e35eb-2caf-41dd-af8d-55eb39d06075	t	2025-10-04 22:52:25.221189
58f7f5d6-6f40-42e1-8c35-463960dd03b5	Amazon Everest		126150cd-9e21-4719-a8f7-c1aea359119c	t	2025-10-04 22:52:35.65338
e6c17435-aee6-447e-8ebe-c790170caf39	Amazon Bingo		126150cd-9e21-4719-a8f7-c1aea359119c	t	2025-10-04 22:52:49.568179
7efdea53-39e7-4948-9232-ef62f529b7e5	Amazon Sonic		126150cd-9e21-4719-a8f7-c1aea359119c	t	2025-10-04 22:52:58.027442
\.


--
-- Data for Name: delivery_locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.delivery_locations (id, name, address, is_active, created_at) FROM stdin;
9a5e35eb-2caf-41dd-af8d-55eb39d06075	Seattle		t	2025-09-09 22:10:57.704118
126150cd-9e21-4719-a8f7-c1aea359119c	Bellevue		t	2025-09-09 22:11:05.88491
\.


--
-- Data for Name: lunchboxes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lunchboxes (id, name, description, price, image_url, is_available, dietary_tags, restaurant_id, created_at, available_days, delivery_building_ids) FROM stdin;
5e423ce1-a21b-4c97-8103-aa15f8581558	Non Veg-Box	Monday - Chicken Makhani + Rajma\nTuesday - Chicken Matar + Dal\nWednesday - Rajma + Chicken Mix	11.99		t	{}	6948b395-9734-4013-8046-a8a2e9ba29cf	2025-10-04 23:05:35.626482	{monday,tuesday,wednesday}	{704c392f-dea9-40ec-8f92-dd33b3a2a9a2,efcfc80a-b472-4f18-a302-40b545f631ab}
3d0e4d6c-cbd6-4db4-a951-88121e0b9b66	Veg-Box	Monday - Paneer Makhani + Rajma\nTuesday - Paneer Matar + Dal\nWednesday - Rajma + Veg Mix	11.99		t	{}	6948b395-9734-4013-8046-a8a2e9ba29cf	2025-10-04 23:07:12.099255	{monday,tuesday,wednesday}	{704c392f-dea9-40ec-8f92-dd33b3a2a9a2,efcfc80a-b472-4f18-a302-40b545f631ab}
18dd24ad-82df-42aa-b04f-fa6885dd323f	Dal makhani box	Dal makhani, rice, achar, papad, roti	15.99		t	{}	30f3b9e5-06ac-4caa-8349-66c781dade41	2025-10-04 23:17:29.749826	{monday,tuesday,wednesday,thursday,friday}	{58f7f5d6-6f40-42e1-8c35-463960dd03b5}
70f4d277-9d41-4c7a-97db-d4ef568af62b	Paneer Thali	Paneer curry, dal, rice, chapati, curd	19.99		t	{}	30f3b9e5-06ac-4caa-8349-66c781dade41	2025-10-04 23:18:41.015181	{monday,tuesday,wednesday,thursday,friday}	{58f7f5d6-6f40-42e1-8c35-463960dd03b5}
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, lunchbox_id, quantity, price) FROM stdin;
06649a70-311e-4555-a1f9-0eb469d425af	94c2f1e5-1a82-45f1-b91f-5071dc979359	3d0e4d6c-cbd6-4db4-a951-88121e0b9b66	1	11.99
acd34072-e7cb-4df6-ae42-901c6c81e154	451ce8e9-9c71-4cea-aed2-bb74ea4c14d3	18dd24ad-82df-42aa-b04f-fa6885dd323f	1	15.99
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, customer_id, restaurant_id, status, subtotal, delivery_fee, service_fee, tax, total, delivery_location, created_at, order_number, delivery_day, delivery_building_id) FROM stdin;
94c2f1e5-1a82-45f1-b91f-5071dc979359	201a0dac-35b3-4438-91f5-717d55b7574f	6948b395-9734-4013-8046-a8a2e9ba29cf	confirmed	11.99	0.00	1.50	1.20	14.69	Seattle	2025-10-04 23:11:00.39835	3	tuesday	704c392f-dea9-40ec-8f92-dd33b3a2a9a2
451ce8e9-9c71-4cea-aed2-bb74ea4c14d3	f0da714e-7c3a-4222-ba75-48236cd32c5b	30f3b9e5-06ac-4caa-8349-66c781dade41	cancelled	15.99	0.00	1.50	1.60	19.09	Bellevue	2025-10-04 23:23:03.103519	4	monday	58f7f5d6-6f40-42e1-8c35-463960dd03b5
\.


--
-- Data for Name: restaurants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.restaurants (id, name, description, cuisine, image_url, rating, delivery_time, delivery_fee, is_active, owner_id, created_at, delivery_location_id) FROM stdin;
6948b395-9734-4013-8046-a8a2e9ba29cf	Rama's Kitchen	Rama's Kitchen was built with a vision to delight customer with Indian cuisine	indian	/public-objects/321c188f-2568-43ee-8098-85452e33273b	0.0	\N	0.00	t	d6087792-6ac8-41ef-9119-d11db10a6b09	2025-10-04 23:03:25.985646	9a5e35eb-2caf-41dd-af8d-55eb39d06075
30f3b9e5-06ac-4caa-8349-66c781dade41	Indian masala 	Serving indian food with a twist.	indian		0.0	\N	0.00	t	ee5003dc-0de8-4695-a375-c8c53da9ccd9	2025-10-04 23:16:28.544188	126150cd-9e21-4719-a8f7-c1aea359119c
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
9IWQFExiFlYTL1FctWzh6XXJpr-dJa-6	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"}}	2025-10-07 21:26:30
MbDBqYBj20o7CyOI3U6Orgq1HttC4tW8	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"}}	2025-10-07 16:00:50
DqZuQAlnMJvcLmQxMLzMIoP5PQdBAAdz	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"}}	2025-10-07 16:15:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password, role, created_at, provider, provider_id, profile_complete, full_name, phone_number, delivery_location_id) FROM stdin;
d6087792-6ac8-41ef-9119-d11db10a6b09	rama_kitchen	ramakitchen@gmail.com	d262f5e8efa01ecc47cc069598e1f5b5a5d3e53bdc93c1b56afd4a48b1c08414327081e39533a19e6e6de0766bd8f8ddeb2790cd03dcd991000e54187b8d26f5.a533fb6f8b2667d7d3aebb837ac190a2	restaurant_owner	2025-10-04 23:00:38.334179	local	\N	t	Rama	1234567890	\N
201a0dac-35b3-4438-91f5-717d55b7574f	Ankush Khandelwal	khandelwal.ankush@gmail.com	\N	customer	2025-10-04 23:09:02.130915	google	117106494720500094210	t	Ankush Khandelwal	2068414315	9a5e35eb-2caf-41dd-af8d-55eb39d06075
ee5003dc-0de8-4695-a375-c8c53da9ccd9	Parul Agrawal	parulagrawal99@gmail.com	\N	restaurant_owner	2025-10-04 23:14:50.524625	google	101377617949113309954	t	Parul Ag	2069545839	\N
f0da714e-7c3a-4222-ba75-48236cd32c5b	Parul	parulagrawal@gmail.com	b3b7d253c142e394868e480b8ffa0192de881d838858384452d9542a3f061a409c9e7e1f3961854ae33c1737ad32413c5af62ec7b558ddefaec331edc0766b40.80f86adee8d1ea2926c060c22fb92657	customer	2025-10-04 23:20:59.608638	local	\N	t	Parul	2069545839	126150cd-9e21-4719-a8f7-c1aea359119c
eef3b638-fca0-4b51-9892-894af6b47ef2	ankush_admin	inthebox.business@gmail.com	96cbe75d936a3e75d64dd0782abd6b2591beeee64ac61cd1e1895f9b26a8b1506aa1148a74152fcc6e79c139b7191144ec6df26908a339da06a88bbaacb9bc18.da43a957f4d09a3f56eded86e66a09aa	admin	2025-10-04 22:00:25.426632	google	110607745083543057203	t	\N	\N	\N
2c2a471b-5a5e-4aca-a7e0-b42b178f7a6f	restaurant_2	inthebox.bus@gmail.com	9f2770c78932c406f9b373ffed5ab3cad801acdd42a116ebce016a1fcdb4a2a94f9bc7bf00e7ce5a8c26ea17160b66969c3a7152537c1e35adaf6291457d708b.41c7b64673c12fa268443d92309dbfc5	restaurant_owner	2025-10-06 21:06:56.560589	local	\N	t	\N	\N	\N
\.


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE SET; Schema: _system; Owner: -
--

SELECT pg_catalog.setval('_system.replit_database_migrations_v1_id_seq', 1, true);


--
-- Name: orders_order_number_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_order_number_seq', 4, true);


--
-- Name: replit_database_migrations_v1 replit_database_migrations_v1_pkey; Type: CONSTRAINT; Schema: _system; Owner: -
--

ALTER TABLE ONLY _system.replit_database_migrations_v1
    ADD CONSTRAINT replit_database_migrations_v1_pkey PRIMARY KEY (id);


--
-- Name: delivery_buildings delivery_buildings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_buildings
    ADD CONSTRAINT delivery_buildings_pkey PRIMARY KEY (id);


--
-- Name: delivery_locations delivery_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_locations
    ADD CONSTRAINT delivery_locations_pkey PRIMARY KEY (id);


--
-- Name: lunchboxes lunchboxes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lunchboxes
    ADD CONSTRAINT lunchboxes_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: restaurants restaurants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: idx_replit_database_migrations_v1_build_id; Type: INDEX; Schema: _system; Owner: -
--

CREATE UNIQUE INDEX idx_replit_database_migrations_v1_build_id ON _system.replit_database_migrations_v1 USING btree (build_id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: delivery_buildings delivery_buildings_delivery_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_buildings
    ADD CONSTRAINT delivery_buildings_delivery_location_id_fkey FOREIGN KEY (delivery_location_id) REFERENCES public.delivery_locations(id);


--
-- Name: lunchboxes lunchboxes_restaurant_id_restaurants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lunchboxes
    ADD CONSTRAINT lunchboxes_restaurant_id_restaurants_id_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);


--
-- Name: order_items order_items_lunchbox_id_lunchboxes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_lunchbox_id_lunchboxes_id_fk FOREIGN KEY (lunchbox_id) REFERENCES public.lunchboxes(id);


--
-- Name: order_items order_items_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: orders orders_customer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_users_id_fk FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: orders orders_delivery_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_delivery_building_id_fkey FOREIGN KEY (delivery_building_id) REFERENCES public.delivery_buildings(id);


--
-- Name: orders orders_restaurant_id_restaurants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_restaurant_id_restaurants_id_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);


--
-- Name: restaurants restaurants_delivery_location_id_delivery_locations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_delivery_location_id_delivery_locations_id_fk FOREIGN KEY (delivery_location_id) REFERENCES public.delivery_locations(id);


--
-- Name: restaurants restaurants_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

