-- sqlite_master fixture for manual/regression testing of the DDL parser.
--
-- This is the kind of output SQLite itself produces for:
--   SELECT type, name, tbl_name, rootpage, sql
--   FROM sqlite_master
--   WHERE sql IS NOT NULL
--   ORDER BY type, name;
--
-- It intentionally includes the unquoted `rootpage` integer column (as
-- `SELECT *` or `.dump` would emit, see B-004) between `tbl_name` and `sql`,
-- and a `DEFAULT ''`/CHECK with an escaped `''` inside the `sql` column
-- (see B-001) to exercise the state-machine quote extractor.
--
-- Paste this whole file into the "Import DDL or sqlite_master output" box.

INSERT INTO sqlite_master VALUES('table','customers','customers',2,'CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  city TEXT DEFAULT '''',
  status TEXT CHECK (status IN (''active'',''inactive'')) DEFAULT ''active'',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)');
INSERT INTO sqlite_master VALUES('table','orders','orders',5,'CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  product_id INTEGER,
  amount REAL,
  status TEXT,
  order_date TEXT,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products(id)
)');
INSERT INTO sqlite_master VALUES('table','products','products',8,'CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  price REAL,
  stock INTEGER
)');
INSERT INTO sqlite_master VALUES('index','idx_orders_customer','orders',12,'CREATE INDEX idx_orders_customer ON orders(customer_id)');
INSERT INTO sqlite_master VALUES('view','active_customers','active_customers',0,'CREATE VIEW active_customers AS SELECT * FROM customers WHERE status = ''active''');
