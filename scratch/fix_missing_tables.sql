CREATE TABLE IF NOT EXISTS "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid,
	"product_id" uuid,
	"variant_id" uuid,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_number" text,
	"customer_name" text DEFAULT 'Consumidor Final',
	"payment_method" text NOT NULL,
	"terminal_id" text,
	"subtotal" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"charge" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"center_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text,
	"cash_register_id" uuid,
	CONSTRAINT "sales_sale_number_unique" UNIQUE("sale_number")
);

ALTER TABLE "sale_items" DROP CONSTRAINT IF EXISTS "sale_items_sale_id_sales_id_fk";
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "sale_items" DROP CONSTRAINT IF EXISTS "sale_items_product_id_product_id_fk";
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "sales_center_id_center_id_fk";
ALTER TABLE "sales" ADD CONSTRAINT "sales_center_id_center_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."center"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "sales_cash_register_id_cash_register_id_fk";
ALTER TABLE "sales" ADD CONSTRAINT "sales_cash_register_id_cash_register_id_fk" FOREIGN KEY ("cash_register_id") REFERENCES "public"."cash_register"("id") ON DELETE no action ON UPDATE no action;
