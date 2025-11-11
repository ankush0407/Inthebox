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
-- Name: orders order_number; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_number SET DEFAULT nextval('public.orders_order_number_seq'::regclass);


--
-- Data for Name: delivery_buildings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.delivery_buildings (id, name, address, delivery_location_id, is_active, created_at) FROM stdin;
c05fc312-bd7c-4130-87c6-828cc28501d2	Amazon Dawson		8414d534-7523-4196-9053-63fc28a535a6	t	2025-10-03 21:34:24.535933
724799da-ebc2-42eb-9cfa-77a8c1a41739	Amazon Ruby		8414d534-7523-4196-9053-63fc28a535a6	t	2025-10-03 21:34:43.277289
1f9b2229-cefa-4c12-9c15-3eaf57f9c554	Amazon Doppler		8414d534-7523-4196-9053-63fc28a535a6	t	2025-10-03 21:34:59.863509
da013d9f-4aa5-4f40-b885-879e194a975c	Amazon Everest		549b4550-a34f-46ed-8787-f0a730bbae6f	t	2025-10-03 21:35:12.939058
b1132c9b-c123-46ee-a935-45445fc1b06c	Amazon Bingo		549b4550-a34f-46ed-8787-f0a730bbae6f	t	2025-10-03 21:35:25.974461
\.


--
-- Data for Name: delivery_locations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.delivery_locations (id, name, address, is_active, created_at) FROM stdin;
8414d534-7523-4196-9053-63fc28a535a6	Seattle		t	2025-09-04 21:17:59.749427
c1da4cf5-4323-4d05-aa69-16bae11b8cb1	Redmond		t	2025-09-04 21:17:59.749427
549b4550-a34f-46ed-8787-f0a730bbae6f	Bellevue		t	2025-09-04 21:17:59.749427
\.


--
-- Data for Name: lunchboxes; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, lunchbox_id, quantity, price) FROM stdin;
f3c014ca-6483-4097-adc1-0b0a56d53d70	36015fd4-eed0-40aa-8356-492374bdda09	28f04e8a-ad0b-4e8f-ae31-b55b4ed4202c	1	10.81
e59cb636-7bcc-4091-9bfe-f95a7c4783d8	27110811-1671-4a42-9103-6341e68d1284	28f04e8a-ad0b-4e8f-ae31-b55b4ed4202c	1	10.81
b13295ea-3777-49c2-91e5-9e4329bfa009	2298e949-3be4-47c8-9046-c31ea709fe53	28f04e8a-ad0b-4e8f-ae31-b55b4ed4202c	1	10.81
4a1a5f95-4bd9-41a7-87f5-c75ebbe68887	bc41530e-8ba6-48cf-97c3-fbc1f7f0ea0c	28f04e8a-ad0b-4e8f-ae31-b55b4ed4202c	2	10.81
ea117a4e-46fc-4285-91d9-d60815a6aa45	c18afe56-29ce-47f8-a365-cba93a5d4d87	28f04e8a-ad0b-4e8f-ae31-b55b4ed4202c	1	10.81
16402bae-07be-4da6-b056-788701019d5e	f344616a-bb52-43f6-8100-f724d5c0a6e4	3500ba4d-bbc0-4040-86fa-3f2964ad2dd6	1	10.99
7c949d9d-f5d0-44ed-8560-bbb2167ce3e6	6a1beba2-6949-4388-b0ba-651746522f0d	3500ba4d-bbc0-4040-86fa-3f2964ad2dd6	1	10.99
3b915d00-c299-40d3-bd4b-d468e8d6de07	e0817735-e241-4e7b-a189-0bee64933b1a	3500ba4d-bbc0-4040-86fa-3f2964ad2dd6	1	10.99
79c2370a-8f21-4e1a-bf73-fbc26faf6173	a632a0fa-7a71-4fde-9aad-bf998a92c88b	e0c28e41-cf76-40ad-8908-6d7f5d1b63d6	1	7.99
899f5f18-8875-4d4b-ac1e-06dedafe7bf5	a632a0fa-7a71-4fde-9aad-bf998a92c88b	25a43f01-5d15-4054-8d8d-249d8bf449c7	1	8.99
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, customer_id, restaurant_id, status, subtotal, delivery_fee, service_fee, tax, total, delivery_location, created_at, order_number, delivery_day, delivery_building_id) FROM stdin;
2298e949-3be4-47c8-9046-c31ea709fe53	755432dc-1d88-41d7-a84e-9a7365439558	afcbe3ca-2f99-4913-af63-5f80b73b1bd0	delivered	10.81	0.00	1.50	1.08	13.39	Amazon Bellevue	2025-09-07 20:53:18.848446	3	monday	\N
bc41530e-8ba6-48cf-97c3-fbc1f7f0ea0c	755432dc-1d88-41d7-a84e-9a7365439558	afcbe3ca-2f99-4913-af63-5f80b73b1bd0	delivered	21.62	0.00	1.50	2.16	25.28	Amazon Bellevue	2025-09-07 20:58:11.432244	4	tuesday	\N
36015fd4-eed0-40aa-8356-492374bdda09	755432dc-1d88-41d7-a84e-9a7365439558	afcbe3ca-2f99-4913-af63-5f80b73b1bd0	delivered	10.81	0.00	1.50	1.08	13.39	Amazon Bellevue	2025-09-06 16:53:36.886675	1	tuesday	\N
27110811-1671-4a42-9103-6341e68d1284	755432dc-1d88-41d7-a84e-9a7365439558	afcbe3ca-2f99-4913-af63-5f80b73b1bd0	delivered	10.81	0.00	1.50	1.08	13.39	Amazon Bellevue	2025-09-06 17:27:56.990339	2	tuesday	\N
c18afe56-29ce-47f8-a365-cba93a5d4d87	a50bd5a9-7f7a-4360-bf86-7646bd740165	afcbe3ca-2f99-4913-af63-5f80b73b1bd0	pending	10.81	0.00	1.50	1.08	13.39	Amazon Bellevue	2025-10-03 19:50:08.793475	5	tuesday	\N
f344616a-bb52-43f6-8100-f724d5c0a6e4	a50bd5a9-7f7a-4360-bf86-7646bd740165	eddd220e-32b0-484b-a1c5-ace96cbb8d1b	confirmed	10.99	0.00	1.50	1.10	13.59	Amazon SLU	2025-10-03 20:24:28.28971	6	monday	\N
6a1beba2-6949-4388-b0ba-651746522f0d	a50bd5a9-7f7a-4360-bf86-7646bd740165	eddd220e-32b0-484b-a1c5-ace96cbb8d1b	confirmed	10.99	0.00	1.50	1.10	13.59	Seattle	2025-10-04 01:54:55.675062	7	monday	724799da-ebc2-42eb-9cfa-77a8c1a41739
e0817735-e241-4e7b-a189-0bee64933b1a	a50bd5a9-7f7a-4360-bf86-7646bd740165	eddd220e-32b0-484b-a1c5-ace96cbb8d1b	pending	10.99	0.00	1.50	1.10	13.59	Seattle	2025-10-04 03:11:29.610183	8	tuesday	1f9b2229-cefa-4c12-9c15-3eaf57f9c554
a632a0fa-7a71-4fde-9aad-bf998a92c88b	a50bd5a9-7f7a-4360-bf86-7646bd740165	4b9edb8d-8769-4351-9680-cf0b75b3a728	pending	16.98	2.99	1.50	1.70	23.17	Bellevue	2025-10-04 03:42:34.509853	9	friday	b1132c9b-c123-46ee-a935-45445fc1b06c
\.


--
-- Data for Name: restaurants; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
58QlNcwxLQOCQAaexpCoOeqtZyhbAbBa	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"}}	2025-11-12 17:11:57
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password, role, created_at, provider, provider_id, profile_complete, full_name, phone_number, delivery_location_id) FROM stdin;
e2760513-8a67-41ea-96fe-abc7c67cf12c	restaurant_owner1	owner1@restaurant.com	7c2f2b59f2c36d3267419a4224c97d8b2fee3ca3ccdd570d2f93e02ec831739839d9467f9ba5e216c1422dccc388855ffeb6706aff9bc5155046c6ffe379665d.3fd56d73532bb771c8f54fa6b529b93b	restaurant_owner	2025-09-02 21:54:11.552293	local	\N	t	\N	\N	\N
f0a60d55-97e4-4d4c-a3ec-f7cb795cd3de	restaurant_owner2	owner2@restaurant.com	7c2f2b59f2c36d3267419a4224c97d8b2fee3ca3ccdd570d2f93e02ec831739839d9467f9ba5e216c1422dccc388855ffeb6706aff9bc5155046c6ffe379665d.3fd56d73532bb771c8f54fa6b529b93b	restaurant_owner	2025-09-02 21:54:11.552293	local	\N	t	\N	\N	\N
d5e7bc9f-1336-4077-ae9e-21eb4648b5bb	admin	admin@lunchbox.com	bbdede6b0e9cc372cebc063e4b937879023a89caceaf3a924b88e68d216df308fa75547d6a3726e417e57072ad84d09ed5a3c5b91852682eeefc4a9ead7086ee.59aa86bfc146a033733edf1957007517	admin	2025-09-02 21:54:11.552293	local	\N	t	\N	\N	\N
dd2d404e-9d3e-44cb-9078-8f215754ac99	restaurant_owner3	inthebox.busines@gmail.com	0d9addd3e1664e59e60ce6410f364ccbdb5f9ff2967b2b2ca40206354eaebb07cc4f5aae6d3ce7e43312a0ab67bb07aadee81588c14a58d470a5ffa2887ae904.90dbd780d3b7e828810cd42455ee95c9	restaurant_owner	2025-09-03 00:02:39.803146	local	\N	t	Ankush Khandelwal	1234567890	\N
e82ad8ec-5841-41fc-99fe-767cfe4e91aa	admin123	admin@gmail.com	admin123	admin	2025-09-09 22:05:31.264984	local	\N	t	\N	\N	\N
b64a7aae-fcd8-42da-be93-8d85f9b2385a	test_restaurant	test@restaurant.com	$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	restaurant_owner	2025-09-02 23:57:09.618763	local	\N	t	\N	\N	\N
96e3b41d-2590-4f36-8704-a8084728639d	customer1	customer1@amazon.com	7c2f2b59f2c36d3267419a4224c97d8b2fee3ca3ccdd570d2f93e02ec831739839d9467f9ba5e216c1422dccc388855ffeb6706aff9bc5155046c6ffe379665d.3fd56d73532bb771c8f54fa6b529b93b	customer	2025-09-02 21:54:11.552293	local	\N	t	\N	\N	\N
f53395b2-b05d-4a5c-bafd-c6a3872b90f4	testowner	test@example.com	d965b3ba3b5d572d6311502571ac135547980b001d7e8f8a7879f20f9c01c45d7f1003ccfee8135b8ca0999462659b6f4111ea6dd08715e671d527e133a2bedd.ab0800cbb2ff8431f423059f4f128337	customer	2025-10-06 21:18:30.369424	local	\N	t	\N	\N	\N
f02556d6-05ac-43fa-9681-fe99e3c67b88	admin1234	inthebox.bss@gmail.com	aa3f0defcfd3e798bb5aab9210733bab58ced0f3b771d219acba572ac90f9ded2bbc7f75832df56bb3148de7174b0e51461ac876d58dac849b34ba29ccf08c12.69ab74cb41eb8961c3885ae2a47bdbb2	admin	2025-10-03 20:33:11.330897	local	\N	t	\N	\N	\N
755432dc-1d88-41d7-a84e-9a7365439558	Ankush Khandelwal	khandelwal.ankush@gmail.com	\N	customer	2025-09-06 04:46:11.662126	google	117106494720500094210	t	Ankush Khandelwal	2068414315	549b4550-a34f-46ed-8787-f0a730bbae6f
62ac2a8b-8fc6-4279-b9f9-f933457081f4	restaurant_owner	inthebox.busine@gmail.com	4b28507dac797721f29f40d8443f85dca0bf1690278db9b572f8a8f064209ed7bf04eed788e8ee027376f6b6c9ad24e11594a3761e1910988d05c87d27e917ec.62e1b5e4e158078fc2186f211d275ab1	restaurant_owner	2025-10-03 19:58:57.631651	local	\N	t	Ankush Khandelwal	2068414315	\N
2d295882-1a08-4c08-a7db-8847a37a7d3a	restaurant_1	inthebox.bus@gmail.com	a95e6e199754e808f6910b741489a990c2267f6d5540a75d84170d0b8916bae2f3f703d8ce17806039114b79799d5347d79fce1124e9dd5944fab12bff90b2ba.39fa0f51346a7c98233a71510ffb1c52	restaurant_owner	2025-10-04 03:28:59.567241	local	\N	t	Gaurav	1234567890	\N
a50bd5a9-7f7a-4360-bf86-7646bd740165	ankush0407	inthebox.business@gmail.com	96cbe75d936a3e75d64dd0782abd6b2591beeee64ac61cd1e1895f9b26a8b1506aa1148a74152fcc6e79c139b7191144ec6df26908a339da06a88bbaacb9bc18.da43a957f4d09a3f56eded86e66a09aa	admin	2025-10-03 19:48:02.645639	local	\N	t	Ankush Khandelwal	2068414315	8414d534-7523-4196-9053-63fc28a535a6
\.


--
-- Name: orders_order_number_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_order_number_seq', 9, true);


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

