--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (415ebe8)
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
-- Name: order_status; Type: TYPE; Schema: public; Owner: neondb_owner
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


ALTER TYPE public.order_status OWNER TO neondb_owner;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_role AS ENUM (
    'customer',
    'restaurant_owner',
    'admin'
);


ALTER TYPE public.user_role OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: delivery_buildings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.delivery_buildings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    delivery_location_id character varying NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.delivery_buildings OWNER TO neondb_owner;

--
-- Name: delivery_locations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.delivery_locations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.delivery_locations OWNER TO neondb_owner;

--
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.email_verifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    code text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_verifications OWNER TO neondb_owner;

--
-- Name: lunchboxes; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.lunchboxes OWNER TO neondb_owner;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.order_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying,
    lunchbox_id character varying,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL
);


ALTER TABLE public.order_items OWNER TO neondb_owner;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.orders OWNER TO neondb_owner;

--
-- Name: orders_order_number_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.orders_order_number_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_order_number_seq OWNER TO neondb_owner;

--
-- Name: orders_order_number_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.orders_order_number_seq OWNED BY public.orders.order_number;


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.password_resets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    token text NOT NULL,
    code text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.password_resets OWNER TO neondb_owner;

--
-- Name: restaurants; Type: TABLE; Schema: public; Owner: neondb_owner
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


ALTER TABLE public.restaurants OWNER TO neondb_owner;

--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
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
    delivery_location_id text,
    email_verified boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: orders order_number; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_number SET DEFAULT nextval('public.orders_order_number_seq'::regclass);


--
-- Data for Name: delivery_buildings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.delivery_buildings (id, name, address, delivery_location_id, is_active, created_at) FROM stdin;
c05fc312-bd7c-4130-87c6-828cc28501d2	Amazon Dawson		8414d534-7523-4196-9053-63fc28a535a6	t	2025-10-03 21:34:24.535933
724799da-ebc2-42eb-9cfa-77a8c1a41739	Amazon Ruby		8414d534-7523-4196-9053-63fc28a535a6	t	2025-10-03 21:34:43.277289
1f9b2229-cefa-4c12-9c15-3eaf57f9c554	Amazon Doppler		8414d534-7523-4196-9053-63fc28a535a6	t	2025-10-03 21:34:59.863509
da013d9f-4aa5-4f40-b885-879e194a975c	Amazon Everest		549b4550-a34f-46ed-8787-f0a730bbae6f	t	2025-10-03 21:35:12.939058
b1132c9b-c123-46ee-a935-45445fc1b06c	Amazon Bingo		549b4550-a34f-46ed-8787-f0a730bbae6f	t	2025-10-03 21:35:25.974461
\.


--
-- Data for Name: delivery_locations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.delivery_locations (id, name, address, is_active, created_at) FROM stdin;
8414d534-7523-4196-9053-63fc28a535a6	Seattle		t	2025-09-04 21:17:59.749427
c1da4cf5-4323-4d05-aa69-16bae11b8cb1	Redmond		t	2025-09-04 21:17:59.749427
549b4550-a34f-46ed-8787-f0a730bbae6f	Bellevue		t	2025-09-04 21:17:59.749427
\.


--
-- Data for Name: email_verifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.email_verifications (id, email, code, expires_at, verified, created_at) FROM stdin;
6c448257-0c44-487d-b9bb-c48e08c8f729	test-FWG-mn@example.com	479785	2025-11-12 13:35:29.558	f	2025-11-12 13:20:29.618229
7dc9a8a5-a0f9-4bbf-a9d0-3dabfecc334f	test-_bkA81@example.com	899716	2025-11-12 13:38:25.331	f	2025-11-12 13:23:25.385663
3c08aab9-0bc1-4b34-9610-bc6aa9101df2	khandelwal.ankush@gmail.com	350582	2025-11-12 13:50:35.61	t	2025-11-12 13:35:35.663561
28541ad2-ad5a-43e7-ab1a-73b50cdbeb0b	customer-DvRdn9@test.com	292613	2025-11-12 18:56:23.109	t	2025-11-12 18:41:23.163845
205f264e-3415-45f0-83dd-34ea3c519b60	user1-3190BI@test.com	305537	2025-11-12 19:01:48.592	t	2025-11-12 18:46:48.645334
ba363225-e511-4929-876d-bdd7a5b8bf9d	user2-sxZ0GM@test.com	310677	2025-11-12 19:10:06.558	t	2025-11-12 18:55:06.609545
\.


--
-- Data for Name: lunchboxes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lunchboxes (id, name, description, price, image_url, is_available, dietary_tags, restaurant_id, created_at, available_days, delivery_building_ids) FROM stdin;
a9e28c65-8fb4-42f5-b0ca-fe89a57dd93b	Mediterranean Bowl	Grilled chicken, quinoa, roasted vegetables, hummus, and tzatziki sauce	14.99	\N	t	{Gluten-Free,High-Protein}	3b8f150a-b9bc-4d9b-bc23-1e65e467b4f6	2025-09-02 21:54:48.764993	{monday,tuesday,wednesday,thursday,friday}	\N
1106c9f3-dd3c-4b3f-a137-4dff4810d88e	Falafel Wrap Box	Crispy falafel, fresh vegetables, tahini sauce in pita wrap with sides	12.99	\N	t	{Vegetarian,Vegan}	3b8f150a-b9bc-4d9b-bc23-1e65e467b4f6	2025-09-02 21:54:48.764993	{monday,tuesday,wednesday,thursday,friday}	\N
ac44a7d8-00e5-4430-b025-4200bb0c5949	Greek Salad Deluxe	Large Greek salad with grilled chicken, olives, feta, and olive oil dressing	13.49	\N	t	{Keto-Friendly,Low-Carb}	3b8f150a-b9bc-4d9b-bc23-1e65e467b4f6	2025-09-02 21:54:48.764993	{monday,tuesday,wednesday,thursday,friday}	\N
b5248638-a2bf-497c-bcb4-1240efeb6fd4	Salmon Teriyaki Bento	Grilled salmon teriyaki, steamed rice, miso soup, and pickled vegetables	16.99	\N	t	{High-Protein,Omega-3}	a8f11f54-b579-44e9-8056-4bc123a2dd95	2025-09-02 21:54:48.764993	{monday,tuesday,wednesday,thursday,friday}	\N
49cf1d56-b92b-43a2-b014-400497950aa7	Chicken Katsu Box	Crispy chicken katsu, steamed rice, salad, and tonkatsu sauce	15.49	\N	t	{"Comfort Food"}	a8f11f54-b579-44e9-8056-4bc123a2dd95	2025-09-02 21:54:48.764993	{monday,tuesday,wednesday,thursday,friday}	\N
b695094f-6b87-4132-9994-990215a03ce6	Vegetable Sushi Combo	Assorted vegetable sushi rolls with edamame and miso soup	13.99	\N	t	{Vegetarian,Low-Calorie}	a8f11f54-b579-44e9-8056-4bc123a2dd95	2025-09-02 21:54:48.764993	{monday,tuesday,wednesday,thursday,friday}	\N
acca29e3-1afd-4666-8a1d-563a1de234d0	Chicken Parmigiana Box	Breaded chicken parmigiana with pasta, garlic bread, and side salad	15.99	\N	t	{"Comfort Food"}	da71590c-b219-4614-96d1-db4672438eb4	2025-09-02 21:54:48.764993	{monday,tuesday,wednesday,thursday,friday}	\N
ae1196dd-4e16-4dfa-8464-3c371ea67077	Pasta Primavera	Fresh pasta with seasonal vegetables in creamy sauce, with garlic bread	13.99	\N	t	{Vegetarian}	da71590c-b219-4614-96d1-db4672438eb4	2025-09-02 21:54:48.764993	{monday,tuesday,wednesday,thursday,friday}	\N
dab2d0b0-754f-4188-a3e1-4c2b642627cd	Buddha Bowl Supreme	Quinoa, roasted vegetables, avocado, nuts, seeds, and tahini dressing	12.99	\N	t	{Vegan,Gluten-Free,Superfood}	834cfd72-63b3-4e39-b729-fff438f7af86	2025-09-02 21:54:48.764993	{monday,tuesday,wednesday,thursday,friday}	\N
bfbd4df4-1021-498f-8039-7ea4eaa6174b	Green Goddess Salad	Mixed greens, chickpeas, hemp seeds, nutritional yeast, and green goddess dressing	11.49	\N	t	{Vegan,Raw,Low-Calorie}	834cfd72-63b3-4e39-b729-fff438f7af86	2025-09-02 21:54:48.764993	{monday,tuesday,wednesday,thursday,friday}	\N
d4bc4b2e-d018-4d12-914e-cceb633b6fef	BBQ Burger Box	Classic BBQ burger with sweet potato fries and coleslaw	16.49	\N	t	{"Comfort Food"}	3bf6a812-1446-413b-9228-28a4a934cf37	2025-09-02 21:54:48.764993	{monday,tuesday,wednesday,thursday,friday}	\N
ad77607c-23ac-4fbf-aae9-e228aeb2a71d	Grilled Chicken Club	Grilled chicken club sandwich with regular fries and pickle	14.99	\N	t	{High-Protein}	3bf6a812-1446-413b-9228-28a4a934cf37	2025-09-02 21:54:48.764993	{monday,tuesday,wednesday,thursday,friday}	\N
28f04e8a-ad0b-4e8f-ae31-b55b4ed4202c	Indian Khana	Dal roti and Sabji	10.81	/public-objects/6fafa163-0fa0-4c87-b8af-130579744b58	t	{}	afcbe3ca-2f99-4913-af63-5f80b73b1bd0	2025-09-04 21:10:36.787663	{monday,tuesday}	\N
3500ba4d-bbc0-4040-86fa-3f2964ad2dd6	Tiffin Veg	Paneer + Rajma	10.99	/public-objects/de77c08b-2e1b-45e6-a2e8-858b94365722	t	{}	eddd220e-32b0-484b-a1c5-ace96cbb8d1b	2025-10-03 20:08:48.847428	{monday,tuesday,friday}	{c05fc312-bd7c-4130-87c6-828cc28501d2,724799da-ebc2-42eb-9cfa-77a8c1a41739,1f9b2229-cefa-4c12-9c15-3eaf57f9c554}
25a43f01-5d15-4054-8d8d-249d8bf449c7	Raat Kali	Aromatic flavors of the night	8.99	/public-objects/432720fa-0d7e-4ae8-a1b1-9b4dc52d8b66	t	{}	4b9edb8d-8769-4351-9680-cf0b75b3a728	2025-10-04 03:32:16.468943	{thursday,friday}	{b1132c9b-c123-46ee-a935-45445fc1b06c,da013d9f-4aa5-4f40-b885-879e194a975c}
e0c28e41-cf76-40ad-8908-6d7f5d1b63d6	Veg-box	Monday - Rajma + Chole\nTuesday - Kadhi + Dal\nWednesday - Paneer + Dal	7.99	/public-objects/4b53f4e3-926b-4b55-a9e8-18411255164b	t	{}	4b9edb8d-8769-4351-9680-cf0b75b3a728	2025-10-04 03:33:13.346001	{monday,tuesday,wednesday}	{b1132c9b-c123-46ee-a935-45445fc1b06c}
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.order_items (id, order_id, lunchbox_id, quantity, price) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.orders (id, customer_id, restaurant_id, status, subtotal, delivery_fee, service_fee, tax, total, delivery_location, created_at, order_number, delivery_day, delivery_building_id) FROM stdin;
\.


--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.password_resets (id, user_id, token, code, expires_at, used, created_at) FROM stdin;
\.


--
-- Data for Name: restaurants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.restaurants (id, name, description, cuisine, image_url, rating, delivery_time, delivery_fee, is_active, owner_id, created_at, delivery_location_id) FROM stdin;
da71590c-b219-4614-96d1-db4672438eb4	Italian Corner	Classic Italian pasta and pizza boxes	Italian	\N	0.0	20-30 min	2.49	t	\N	2025-09-02 21:54:25.92552	\N
834cfd72-63b3-4e39-b729-fff438f7af86	Green Garden	Healthy vegetarian and vegan options	Vegetarian	\N	0.0	15-25 min	1.99	t	\N	2025-09-02 21:54:25.92552	\N
3bf6a812-1446-413b-9228-28a4a934cf37	American Grill	Hearty American comfort food	American	\N	0.0	25-35 min	2.99	t	\N	2025-09-02 21:54:25.92552	\N
3b8f150a-b9bc-4d9b-bc23-1e65e467b4f6	Mediterranean Delights	Fresh Mediterranean cuisine with healthy options	Mediterranean	\N	0.0	25-35 min	2.99	t	e2760513-8a67-41ea-96fe-abc7c67cf12c	2025-09-02 21:54:25.92552	8414d534-7523-4196-9053-63fc28a535a6
a8f11f54-b579-44e9-8056-4bc123a2dd95	Tokyo Sushi Box	Authentic Japanese sushi and bento boxes	Japanese	\N	0.0	30-40 min	3.49	t	f0a60d55-97e4-4d4c-a3ec-f7cb795cd3de	2025-09-02 21:54:25.92552	c1da4cf5-4323-4d05-aa69-16bae11b8cb1
afcbe3ca-2f99-4913-af63-5f80b73b1bd0	INTHEBOX	Indian Delight	indian	/public-objects/4416975c-1ca4-43fe-81f2-2b2694f0bb09	0.0	\N	0.00	t	dd2d404e-9d3e-44cb-9078-8f215754ac99	2025-09-04 21:05:57.258005	549b4550-a34f-46ed-8787-f0a730bbae6f
eddd220e-32b0-484b-a1c5-ace96cbb8d1b	Athithi	Indian Food	indian	/public-objects/09a25533-d705-47ea-a5d3-ad39eefa99f5	0.0	\N	0.00	t	62ac2a8b-8fc6-4279-b9f9-f933457081f4	2025-10-03 20:07:08.692718	8414d534-7523-4196-9053-63fc28a535a6
4b9edb8d-8769-4351-9680-cf0b75b3a728	Ankush_1	Indian restaurant with a vibe	asian	/public-objects/87483c6f-b243-4c9e-be80-41bdcf3b9ecd	0.0	\N	2.99	t	2d295882-1a08-4c08-a7db-8847a37a7d3a	2025-10-04 03:30:57.289092	549b4550-a34f-46ed-8787-f0a730bbae6f
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
Smua9WoOOf5AJtlnJQ3FG_oLKw0qMcMm	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"pendingRegistration":{"username":"","email":"","password":"4335eeff7cd589f20a3279c685435e746e8db37157b6e0b5112e51d9cf18b61358b22c15c27fc6a7fbc8511a3f4f1b5e4b52fda3b1b9f09a818ffe478e5ecc6b.cec81e1be7a7cbcec04f64f386c44423","role":"customer"}}	2025-11-13 13:17:49
8zzS3tcLKW6WqJgngPLK32TAbZtYbf9D	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"pendingRegistration":{"username":"user-_bkA81","email":"test-_bkA81@example.com","password":"d36e897e9d3d610323a51a8de7f8dcd145e93fef26fda5e3e734edec600f2d574170834e899907559ce79510debb4220378741dc2c507b1de6352fcbe4ce7eb0.f800f67c6a7ef0c89353cc32f54eafa0","role":"customer"}}	2025-11-13 13:23:26
iA_lGu7KYUlJQpmkIPkqV2WFMZFpzLZx	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"pendingRegistration":{"username":"user-94cPje","email":"test-FWG-mn@example.com","password":"5111a052be1db2b0a1a71283b820c1a068b9ef822169b2194137aedeade17e923f39028854e9a714c70f2c57c9e59e05b64f79b7f94ffeb0920e9eff2220ba6d.652185b2cded76b4231d22228ac79953","role":"customer"}}	2025-11-13 13:20:31
1DU8WPSi9Bxq4jYHksSikjKHLDwmSpZU	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"passport":{"user":"d9c26800-bdd7-411c-b54d-5ddd2316aa8c"}}	2025-11-13 18:44:25
863YH5-zWsQtAlwcMZ-osKfnFY-c7XyF	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"}}	2025-11-13 20:16:38
oLRwNVTb-aHu4wKplgMWR-uoqNQtPSFC	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"pendingRegistration":{"username":"test-rybZ0d","email":"test-rybZ0d@example.com","password":"14edc7042b37c150146621dd34f0c7101af1e5942cdadc5606a659fbc9e05fd4896c088402dc0f4e1b5bac1969ed7b8bda5ce06e623141304d98518d696d5be4.3dad8222052f496658bf5e0d48ffc25b","role":"customer"}}	2025-11-13 13:14:27
f7QBOpugJWWAww3qKQtxtrg_vwV8Rbav	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"}}	2025-11-13 00:25:07
M_nihkihIEKttm1t7GN9xhQnTKzc27qW	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"}}	2025-11-13 13:27:50
lSpf5t_mcK3EET_AR8iP_cdlO8uokamt	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"passport":{"user":"0570d127-9d80-4c3e-ab7a-390fc11cf6ec"}}	2025-11-13 18:57:18
GaCDHTbsQMMZjwvWSSfRVZQrpZ827RIc	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"}}	2025-11-13 01:03:27
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, email, password, role, created_at, provider, provider_id, profile_complete, full_name, phone_number, delivery_location_id, email_verified) FROM stdin;
e2760513-8a67-41ea-96fe-abc7c67cf12c	restaurant_owner1	owner1@restaurant.com	7c2f2b59f2c36d3267419a4224c97d8b2fee3ca3ccdd570d2f93e02ec831739839d9467f9ba5e216c1422dccc388855ffeb6706aff9bc5155046c6ffe379665d.3fd56d73532bb771c8f54fa6b529b93b	restaurant_owner	2025-09-02 21:54:11.552293	local	\N	t	\N	\N	\N	f
f0a60d55-97e4-4d4c-a3ec-f7cb795cd3de	restaurant_owner2	owner2@restaurant.com	7c2f2b59f2c36d3267419a4224c97d8b2fee3ca3ccdd570d2f93e02ec831739839d9467f9ba5e216c1422dccc388855ffeb6706aff9bc5155046c6ffe379665d.3fd56d73532bb771c8f54fa6b529b93b	restaurant_owner	2025-09-02 21:54:11.552293	local	\N	t	\N	\N	\N	f
010825c4-effd-45ba-8c6e-14b3d44167df	cart-user1-fYr5Zw	user1-3190BI@test.com	fcc6c8734a895a055b1909c8abb8d57f9e35f39cf8b62ad36d0d47abaf969e85de89e8e1edee5018e9161e8a8cfc6cd9a8d2ea716ba65ed9fa598696bcc4792d.b391e1bfe60c27621a7a1cc0176991f6	customer	2025-11-12 18:47:53.565428	local	\N	t	cart-user1-fYr5Zw Fullname	2065550100	8414d534-7523-4196-9053-63fc28a535a6	t
dd2d404e-9d3e-44cb-9078-8f215754ac99	restaurant_owner3	inthebox.busines@gmail.com	0d9addd3e1664e59e60ce6410f364ccbdb5f9ff2967b2b2ca40206354eaebb07cc4f5aae6d3ce7e43312a0ab67bb07aadee81588c14a58d470a5ffa2887ae904.90dbd780d3b7e828810cd42455ee95c9	restaurant_owner	2025-09-03 00:02:39.803146	local	\N	t	Ankush Khandelwal	1234567890	\N	f
e82ad8ec-5841-41fc-99fe-767cfe4e91aa	admin123	admin@gmail.com	admin123	admin	2025-09-09 22:05:31.264984	local	\N	t	\N	\N	\N	f
b64a7aae-fcd8-42da-be93-8d85f9b2385a	test_restaurant	test@restaurant.com	$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	restaurant_owner	2025-09-02 23:57:09.618763	local	\N	t	\N	\N	\N	f
0570d127-9d80-4c3e-ab7a-390fc11cf6ec	cart-user2-n_bi1l	user2-sxZ0GM@test.com	d194d06ad20026923e60312a7337462d80a566135f90be53e67f68c24530f2dddf3b4578a2f170307f3e45c77a7d75c0656895a5e805ddf106ef18253066d183.14605353cf9e66208d32a25cfa5fa7d2	customer	2025-11-12 18:56:37.815655	local	\N	t	\N	\N	\N	t
62ac2a8b-8fc6-4279-b9f9-f933457081f4	restaurant_owner	inthebox.busine@gmail.com	4b28507dac797721f29f40d8443f85dca0bf1690278db9b572f8a8f064209ed7bf04eed788e8ee027376f6b6c9ad24e11594a3761e1910988d05c87d27e917ec.62e1b5e4e158078fc2186f211d275ab1	restaurant_owner	2025-10-03 19:58:57.631651	local	\N	t	Ankush Khandelwal	2068414315	\N	f
2d295882-1a08-4c08-a7db-8847a37a7d3a	restaurant_1	inthebox.bus@gmail.com	a95e6e199754e808f6910b741489a990c2267f6d5540a75d84170d0b8916bae2f3f703d8ce17806039114b79799d5347d79fce1124e9dd5944fab12bff90b2ba.39fa0f51346a7c98233a71510ffb1c52	restaurant_owner	2025-10-04 03:28:59.567241	local	\N	t	Gaurav	1234567890	\N	f
d5a96910-9f09-4ab1-85b6-370ff2fe0904	ankush0407	khandelwal.ankush@gmail.com	75675605f7521801de5ea5be3d8c91fbd0d05104a45c160ed2a0f3fb7417d8c004c76b4d2d2213b85588ac1bfcd29dcda3aa76d023f1f3124e1a79a39f581d7d.38638a00e3ef03e5e169a8c23d01138a	customer	2025-11-12 13:35:55.843818	local	\N	t	Ankush Khandelwal	2068414315	8414d534-7523-4196-9053-63fc28a535a6	t
d9c26800-bdd7-411c-b54d-5ddd2316aa8c	cart-test-customer-DvRdn9	customer-DvRdn9@test.com	addc19078cb775a120c5b247e16618eb294abc13853cee975fadb489672e6db1226548b9c434c590243f61e64ff26a21f8b8ee22968857a127628eaa600d4d09.00bfcccd6e656126ea0407924a099c4b	customer	2025-11-12 18:42:09.300847	local	\N	t	\N	\N	\N	t
\.


--
-- Name: orders_order_number_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.orders_order_number_seq', 10, true);


--
-- Name: delivery_buildings delivery_buildings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_buildings
    ADD CONSTRAINT delivery_buildings_pkey PRIMARY KEY (id);


--
-- Name: delivery_locations delivery_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_locations
    ADD CONSTRAINT delivery_locations_pkey PRIMARY KEY (id);


--
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (id);


--
-- Name: lunchboxes lunchboxes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lunchboxes
    ADD CONSTRAINT lunchboxes_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_token_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_token_key UNIQUE (token);


--
-- Name: restaurants restaurants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: delivery_buildings delivery_buildings_delivery_location_id_delivery_locations_id_f; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_buildings
    ADD CONSTRAINT delivery_buildings_delivery_location_id_delivery_locations_id_f FOREIGN KEY (delivery_location_id) REFERENCES public.delivery_locations(id);


--
-- Name: lunchboxes lunchboxes_restaurant_id_restaurants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lunchboxes
    ADD CONSTRAINT lunchboxes_restaurant_id_restaurants_id_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);


--
-- Name: order_items order_items_lunchbox_id_lunchboxes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_lunchbox_id_lunchboxes_id_fk FOREIGN KEY (lunchbox_id) REFERENCES public.lunchboxes(id);


--
-- Name: order_items order_items_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: orders orders_customer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_users_id_fk FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: orders orders_delivery_building_id_delivery_buildings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_delivery_building_id_delivery_buildings_id_fk FOREIGN KEY (delivery_building_id) REFERENCES public.delivery_buildings(id);


--
-- Name: orders orders_restaurant_id_restaurants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_restaurant_id_restaurants_id_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id);


--
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: restaurants restaurants_delivery_location_id_delivery_locations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_delivery_location_id_delivery_locations_id_fk FOREIGN KEY (delivery_location_id) REFERENCES public.delivery_locations(id);


--
-- Name: restaurants restaurants_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

