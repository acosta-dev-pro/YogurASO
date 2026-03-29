-- Datos iniciales del catálogo.

insert into public.products
  (slug, name, flavor, description, short_description, price, stock, volume, image_url,
   background_color, accent_color, category, color_dark, is_active, is_featured,
   badge_text, badge_type, discount_percent, sort_order, letrero_forma, price_1l)
values
('coco','Coco',NULL,NULL,NULL,8000.00,17,'500 ml',NULL,'#D4EAEC','#2A9D60','Especiales','#3DA1A9',true,false,'NUEVO','nuevo',0,0,'pill',0.00),
('pera','Pera',NULL,NULL,NULL,6900.00,40,'500 ml',NULL,'#E6E8C7','#E68A00','Frutales','#8E9500',true,false,'¡OFERTA!','oferta',0,0,'pill',0.00),
('fresa','Fresa','fresa','Yogurt artesanal de fresa, 500 ml',NULL,7500.00,13,'500 ml','assets/products/yoguraso-fresa-500ml-sm.webp','#F8D9DB','#D9202E','Frutales',NULL,true,false,'Oferta','oferta',10,10,'pill',0.00),
('pina','Piña','pina','Yogurt artesanal de piña, 500 ml',NULL,6900.00,99,'500 ml','assets/products/yoguraso-pina-500ml-sm.webp','#F5E6A6','#F2B90F','Frutales',NULL,true,false,NULL,NULL,0,20,'pill',0.00),
('mora','Mora','mora','Yogurt artesanal de mora, 500 ml',NULL,6900.00,10,'500 ml','assets/products/yoguraso-mora-500ml-sm.webp','#E7CBE3','#7E2460','Frutales',NULL,true,false,NULL,NULL,0,30,'pill',0.00),
('melocoton','Melocotón','melocoton','Yogurt artesanal de melocotón, 500 ml',NULL,6900.00,30,'500 ml','assets/products/yoguraso-melocoton-500ml-sm.webp','#FDE4D7','#EE6A22','Frutales','#F88649',true,false,NULL,NULL,0,40,'pill',0.00),
('frutos-rojos','Frutos rojos','frutos-rojos','Yogurt artesanal de frutos rojos, 500 ml',NULL,6900.00,99,'500 ml','assets/products/yoguraso-frutos-rojos-500ml-sm.webp','#F2CBD4','#C21842','Frutales',NULL,true,false,NULL,NULL,0,50,'pill',0.00),
('mango','Mango','mango','Yogurt artesanal de mango, 500 ml',NULL,6900.00,99,'500 ml','assets/products/yoguraso-mango-500ml-sm.webp','#F5DDB0','#F39A12','Frutales',NULL,true,false,NULL,NULL,0,60,'pill',0.00),
('cafe','Café','cafe','Yogurt artesanal de café, 500 ml',NULL,6900.00,99,'500 ml','assets/products/yoguraso-cafe-500ml-sm.webp','#E5D3C4','#6B3420','Especiales',NULL,true,false,NULL,NULL,0,70,'pill',0.00),
('guanabana','Guanábana','guanabana','Yogurt artesanal de guanábana, 500 ml',NULL,6900.00,16,'500 ml','assets/products/yoguraso-guanabana-500ml-sm.webp','#D4E8C9','#3E8A25','Especiales',NULL,true,false,NULL,NULL,0,80,'pill',0.00)
on conflict (slug) do nothing;
