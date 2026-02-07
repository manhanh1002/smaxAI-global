
-- RPC to increment booked_count for a slot
CREATE OR REPLACE FUNCTION increment_slot_booked_count(p_slot_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE booking_slots
  SET booked_count = booked_count + 1
  WHERE id = p_slot_id;
END;
$$;

-- RPC to decrement booked_count for a slot
CREATE OR REPLACE FUNCTION decrement_slot_booked_count(p_slot_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE booking_slots
  SET booked_count = GREATEST(0, booked_count - 1)
  WHERE id = p_slot_id;
END;
$$;

-- RPC to decrement product stock
CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id uuid, p_variant_id uuid, p_quantity int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET current_stock = GREATEST(0, COALESCE(current_stock, total_quantity) - p_quantity)
    WHERE id = p_variant_id;
  ELSE
    UPDATE products
    SET current_stock = GREATEST(0, COALESCE(current_stock, total_quantity) - p_quantity)
    WHERE id = p_product_id;
  END IF;
END;
$$;

-- RPC to restore product stock from a cancelled order
CREATE OR REPLACE FUNCTION restore_product_stock(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity int;
BEGIN
  SELECT product_id, variant_id, quantity 
  INTO v_product_id, v_variant_id, v_quantity
  FROM orders
  WHERE id = p_order_id;

  IF FOUND THEN
    IF v_variant_id IS NOT NULL THEN
      UPDATE product_variants
      SET current_stock = COALESCE(current_stock, total_quantity) + v_quantity
      WHERE id = v_variant_id;
    ELSE
      UPDATE products
      SET current_stock = COALESCE(current_stock, total_quantity) + v_quantity
      WHERE id = v_product_id;
    END IF;
  END IF;
END;
$$;
