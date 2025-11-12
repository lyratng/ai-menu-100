-- 为stores表添加联系人相关字段

ALTER TABLE stores ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS contact_phone TEXT;

COMMENT ON COLUMN stores.contact_person IS '联系人姓名';
COMMENT ON COLUMN stores.contact_phone IS '联系电话';

