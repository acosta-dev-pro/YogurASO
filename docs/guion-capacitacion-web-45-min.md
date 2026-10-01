# Guion de capacitación de YogurASO: 45 minutos

**Público:** personas que atienden pedidos y administran el catálogo  
**Modalidad:** demostración guiada con práctica breve  
**Duración total:** 45 minutos

## Preparación

- Tener abierta la web: `http://localhost:5500/`.
- Confirmar que la API está conectada en `http://localhost:3000/api/health` y que devuelve `database: connected`.
- Abrir también `http://localhost:5500/pages/productos.html` y `http://localhost:5500/pages/admin.html` en pestañas separadas.
- Preparar una cuenta de cliente de prueba y una cuenta de administrador. Entregar las credenciales por un canal privado; no incluir contraseñas en el material compartido.
- Confirmar que el número de WhatsApp configurado es el que se usará en la capacitación. No enviar pedidos reales durante la práctica.
- En administración, crear solo un producto temporal de capacitación. Eliminar únicamente ese producto temporal al terminar.

## Agenda

| Tiempo | Tema |
|---|---|
| 00:00–03:00 | Bienvenida y objetivo |
| 03:00–07:00 | Inicio y navegación |
| 07:00–15:00 | Catálogo, búsqueda y filtros |
| 15:00–20:00 | Detalle, presentaciones y agregar |
| 20:00–26:00 | Carrito y envío por WhatsApp |
| 26:00–33:00 | Cuenta, perfil y seguridad |
| 33:00–42:00 | Administración de productos y usuarios |
| 42:00–45:00 | Práctica final y cierre |

## 00:00–03:00 | Bienvenida

**Facilitador dice:**

> “En estos 45 minutos veremos el recorrido completo: cómo encontrar un producto, armar un pedido, gestionar una cuenta y mantener el catálogo desde administración. La compra se confirma por WhatsApp; esta web no cobra en línea.”

**Mostrar:** portada y navegación superior. Explicar que las acciones de administración requieren iniciar sesión con una cuenta con rol de administrador.

**Aclaración para el grupo:** el carrito se guarda en el navegador. No es un pedido confirmado hasta que el negocio acuerda los detalles por WhatsApp.

## 03:00–07:00 | Inicio y navegación

**Facilitador dice:**

> “La portada presenta la marca, los beneficios, la historia, los productos destacados y el mapa. Desde el menú podemos ir al catálogo o al contacto.”

**Demostrar:**

- Botón **Ver sabores** y enlace **Productos**.
- Sección **Beneficios**: ingredientes reales, elaboración diaria, cobertura local y mayoreo.
- Sección **Sobre nosotros** y mapa **Encuéntranos**.
- Icono de bolsa en el encabezado: abre el carrito lateral.
- En el pie se encuentran navegación, contacto y redes configuradas.

**Frase puente:**

> “Ahora vamos al catálogo, que es donde el cliente compara, filtra y elige.”

## 07:00–15:00 | Catálogo

**Abrir:** `pages/productos.html`.

**Demostrar:**

1. Leer el contador de productos.
2. Buscar por nombre o sabor en **Buscar sabor**.
3. Usar las categorías y ordenar por reciente, precio ascendente/descendente o nombre A–Z.
4. Identificar en una tarjeta la imagen, nombre, categoría, precio y botón **Agregar**.
5. Explicar los indicadores de etiqueta, por ejemplo “Nuevo” o “Destacado”, y el precio rebajado cuando existe descuento.
6. Mostrar que un producto sin stock no se puede agregar.
7. Señalar que el color configurable del producto se ve en el fondo del área de imagen; la parte inferior de la tarjeta queda blanca.

**Facilitador dice:**

> “Los filtros solo cambian lo que vemos en el catálogo. Si no encontramos un producto, borramos la búsqueda o elegimos otra categoría.”

## 15:00–20:00 | Detalle y presentación

**Demostrar:** pulsar una tarjeta para abrir el detalle.

- Se puede escoger **1 L** o **2 L**; 1 L es la opción inicial.
- Cambiar la presentación actualiza el precio unitario y el total.
- Los botones `−` y `+` cambian la cantidad; no permiten bajar de una unidad.
- Revisar el total y luego pulsar **Agregar a la bolsa**.
- Si se agrega el mismo producto con presentaciones distintas, cada tamaño aparece como una línea separada.

**Facilitador dice:**

> “Antes de agregar, revisamos siempre tamaño, cantidad y total. El inventario publicado tiene un precio base por producto y la presentación calcula su propio precio.”

## 20:00–26:00 | Carrito y WhatsApp

**Demostrar:** abrir la bolsa del encabezado y luego la página **Mi carrito**.

- Cambiar cantidades con `−` y `+`.
- Quitar una línea, seleccionar varias o usar **Seleccionar todos**.
- Usar **Vaciar bolsa** solo si se quiere retirar todo.
- Revisar subtotal, entrega por WhatsApp y total.
- Pulsar **Pedir por WhatsApp** para abrir la vista previa con nombres, tamaño, cantidades y precios.
- En la demostración, elegir **Seguir editando**; no confirmar el envío a un número real.

**Facilitador dice:**

> “Al confirmar la vista previa, se prepara un mensaje y se abre WhatsApp. El negocio confirma disponibilidad, entrega y demás condiciones en el chat.”

**Importante:** la aplicación no tiene pasarela de pago ni registra el pedido en PostgreSQL. El historial que aparece en el perfil se guarda localmente en ese navegador, no es un historial central de ventas.

## 26:00–33:00 | Cuenta y seguridad

**Demostrar:**

- **Registrarse:** nombre, apellido, correo, teléfono y contraseña; la contraseña debe tener al menos 8 caracteres.
- **Iniciar sesión:** correo y contraseña. Google solo debe mostrarse como opción si OAuth está habilitado y el dominio está autorizado.
- **Mi perfil → Mis datos:** revisar nombre, apellido, correo y teléfono; el correo no se edita desde esta pantalla. Guardar cambios con el botón correspondiente.
- **Seguridad:** solicitar el código, introducir el código de 6 dígitos y definir/confirmar la nueva contraseña. También existe la alternativa con contraseña actual.
- **Recuperar contraseña:** desde Login se solicita el código por correo, se valida y se establece una nueva clave. Usar al menos 8 caracteres.
- **Pedidos:** muestra compras registradas localmente en ese dispositivo.
- Cerrar sesión desde el perfil o el menú de cuenta.

**Nota para facilitación:** la página de restablecimiento muestra actualmente un texto que dice “mínimo 6”, pero la validación efectiva exige 8 caracteres. Enseñar la regla efectiva de 8 y corregir ese texto de interfaz antes de una capacitación formal.

## 33:00–42:00 | Panel de administración

**Entrar:** `pages/admin.html` con la cuenta de administrador de prueba.

**Inventario (5 min):**

- Leer indicadores de productos, activos, stock total y selección.
- Buscar por nombre, categoría o ID; filtrar por categoría y estado.
- Ordenar las columnas haciendo clic en sus encabezados.
- Seleccionar filas y activar/desactivar en lote.
- **Exportar** descarga un CSV del inventario visible según los filtros.

**Crear/editar producto (3 min):**

- **Nuevo yogur** abre el formulario. Completar nombre, precio, stock, categoría y descripción.
- Subir imagen JPG, PNG, WebP o GIF de hasta 5 MB.
- Elegir **Color de fondo de la tarjeta** con el selector; el color se aplica al área de imagen.
- Marcar **Producto activo** para que se publique en el catálogo.
- La sección opcional de letrero permite escoger tipo y texto; el descuento es independiente y puede combinarse con cualquier etiqueta. La vista previa muestra el precio en tienda.
- **Editar** vuelve a abrir los datos existentes. Guardar cambios actualiza el catálogo.

**Estado y eliminación (1 min):**

- **Desactivar** oculta temporalmente el producto y permite volver a activarlo después.
- **Eliminar** es permanente y no se puede deshacer. Quita el producto de los carritos guardados; el detalle de pedidos anteriores conserva nombre y precio.
- Durante la práctica, no eliminar productos reales. Para explicar el botón, usar solo un producto temporal creado para la sesión.

**Usuarios (1 min):**

- Cambiar a **Usuarios**, buscar por nombre o correo y activar/desactivar cuentas.
- La cuenta de administrador con la que se está trabajando no se puede desactivar desde su propia sesión.
- Este panel no crea usuarios nuevos; el registro se realiza desde la página pública.

## 42:00–45:00 | Práctica y cierre

**Reto de práctica:**

1. Encontrar un sabor usando búsqueda o categoría.
2. Abrirlo, elegir 2 L y cambiar la cantidad a 2.
3. Agregarlo y explicar subtotal y total en el carrito.
4. Entrar a administración, localizar el producto temporal y editar su color o stock.
5. Explicar la diferencia entre desactivar y eliminar permanentemente.

**Cierre sugerido:**

> “El flujo del cliente termina con un mensaje listo para WhatsApp; el equipo confirma la venta allí. El panel mantiene el catálogo y las cuentas, y desactivar es la opción reversible para retirar un producto.”

Dejar los últimos minutos para dudas y recordar cerrar sesión en equipos compartidos.

## Lista rápida del facilitador

- API conectada y base de datos disponible.
- Cuenta de cliente y cuenta admin de prueba; credenciales fuera de este documento.
- Número de WhatsApp comprobado; no enviar mensajes reales durante la práctica.
- Producto temporal identificado claramente y eliminado al final.
- No cambiar ni eliminar productos reales durante la demostración.
- Explicar explícitamente que no hay pago online ni pedidos guardados en servidor.