EXPERIENCIA INMERSIVA — HOTSPOTS ANCLADOS + CÁMARA DE FOCUS

Cambios principales:
- Cada punto de interacción está anclado al cubo correspondiente mediante una relación padre/hijo de Three.js.
- Los hotspots se proyectan desde su posición 3D real, por lo que permanecen sobre su geometría al rotar el mundo.
- Al hacer click en un hotspot, la cámara viaja suavemente hacia la posición real del punto y hace zoom.
- El popup se abre durante el focus.
- Al cerrar el popup, la cámara vuelve suavemente a la posición, orientación y objetivo que tenía antes de hacer click.
- Mientras el popup está abierto, la rotación del mundo se pausa para mantener el hotspot perfectamente encuadrado.
- La esfera central ahora es un núcleo de energía brillante, con emisión, halo y luz puntual animada.
- El zoom sigue sin estar controlado por la rueda; solo se activa al seleccionar una interacción.

Controles:
- Arrastrar izquierda/derecha: órbita horizontal.
- Arrastrar arriba/abajo: movimiento vertical.
- Click en un hotspot: focus + zoom + popup.
- Cerrar popup: regreso al encuadre anterior.
- Inicio: restablece la experiencia.
