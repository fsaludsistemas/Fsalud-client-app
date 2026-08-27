# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

### 🏛️ Dependencias

Las dependencias tienen jerarquía: `ESCUELA/OFICINA → DEPARTAMENTO → SECCION`. El campo `padre_id` define el nodo padre; el servidor calcula `ancestros` automáticamente.

#### `POST /api/dependencias`

Crea una dependencia.

**Body:**

```json
{
  "nombre": "Escuela de Ingeniería de Sistemas",
  "tipo": "ESCUELA",
  "padre_id": null
}
```

```json
{
  "nombre": "Departamento de Redes",
  "tipo": "DEPARTAMENTO",
  "padre_id": "<id_escuela>"
}
```

**Tipos válidos:** `ESCUELA`, `OFICINA`, `DEPARTAMENTO`, `SECCION`

> `padre_id` es `null` para raíces (ESCUELA u OFICINA). El campo `ancestros` **no se envía** — el servidor lo calcula solo.

**Respuesta `201`:**

```json
{
  "id": "dep789",
  "nombre": "Departamento de Redes",
  "tipo": "DEPARTAMENTO",
  "padre_id": "esc001",
  "ancestros": ["esc001"],
  "createdAt": "2026-08-25T15:00:00.000Z"
}
```

---

#### `GET /api/dependencias`

Retorna todas las dependencias.

**Respuesta `200`:** array de dependencias.

---

#### `GET /api/dependencias/:id`

Retorna una dependencia por ID.

**Respuesta `200`:** objeto. **`404`** si no existe.

---

#### `PUT /api/dependencias/:id`

Actualiza parcialmente una dependencia. Si se actualiza `padre_id`, el servidor recalcula `ancestros`.

**Body (ejemplo):**

```json
{
  "nombre": "Departamento de Redes y Comunicaciones"
}
```

**Respuesta `200`:** objeto actualizado.

---

#### `DELETE /api/dependencias/:id`

Elimina una dependencia.

> ⚠️ **Falla con `409`** si:
>
> - Tiene dependencias hijas (`padre_id` apunta a esta)
> - Hay profesores adscritos a ella

**Respuesta `200`:**

```json
{ "message": "Dependencia eliminada correctamente" }
```

**Respuesta `409`:**

```json
{ "message": "No se puede eliminar: existen dependencias hijas asociadas" }
```

---

### 👨‍🏫 Profesores

#### `POST /api/profesores`

Crea un profesor. El `numero_identificacion` debe ser único.

**Body:**

```json
{
  "tipo_identificacion": "CEDULA",
  "numero_identificacion": "1234567890",
  "nombres": "Juan Carlos",
  "apellidos": "Pérez Gómez",
  "email_institucional": "juan.perez@correounivalle.edu.co",
  "lugar_nacimiento": "Cali",
  "fecha_nacimiento": "1985-03-15",
  "telefono": "3001234567",
  "fecha_vinculacion": "2010-01-01",
  "foto_url": "https://...",
  "dependencia_actual": {
    "escuela_o_oficina_id": "<id_escuela>",
    "departamento_id": "<id_departamento>",
    "seccion_id": "<id_seccion>",
    "ancestros": ["<id1>", "<id2>"]
  },
  "estado": "ACTIVO"
}
```

> Campos opcionales: `lugar_nacimiento`, `fecha_nacimiento`, `telefono`, `fecha_vinculacion`, `foto_url`, `dependencia_actual.departamento_id`, `dependencia_actual.seccion_id`

> **Tipos de identificación válidos:** `CEDULA`, `PASAPORTE`, `TARJETA_IDENTIDAD`

**Respuesta `201`:** objeto del profesor creado con su `id` de Firestore.

**Respuesta `409`:**

```json
{ "message": "Ya existe un profesor con ese numero de identificacion" }
```

---

#### `GET /api/profesores`

Retorna todos los profesores.

**Respuesta `200`:** array de profesores.

---

#### `GET /api/profesores/:id`

Retorna un profesor por su ID de Firestore.

**Respuesta `200`:** objeto. **`404`** si no existe.

#### `GET /api/profesores/:id`
Retorna un profesor por su ID de Firestore.

**Respuesta `200`:** objeto. **`404`** si no existe.

> Esta respuesta incluye `docente_periodos`, que es un array con los periodos docentes asociados al profesor.

**Ejemplo de respuesta `200`:**
```json
{
  "id": "prof_123",
  "tipo_identificacion": "CEDULA",
  "numero_identificacion": "1234567890",
  "nombres": "Juan Carlos",
  "apellidos": "Pérez Gómez",
  "email_institucional": "juan.perez@correounivalle.edu.co",
  "docente_periodos": [
    {
      "id": "prof_123_2026-1",
      "profesor_id": "prof_123",
      "periodo_id": "2026-1",
      "tipo_vinculacion": "NOMBRADO",
      "dedicacion": "COMPLETO",
      "cargo": "ASOCIADO",
      "estado": "ACTIVO",
      "nivel": "MAESTRIA",
      "periodo": {
        "id": "2026-1",
        "periodo": "2026-1",
        "createdAt": "2026-08-25T15:00:00.000Z"
      }
    }
  ]
}
```


---

#### `PUT /api/profesores/:id`

Actualiza parcialmente un profesor. Todos los campos son opcionales.

**Body (ejemplo):**

```json
{
  "telefono": "3109876543",
  "estado": "INACTIVO"
}
```

**Respuesta `200`:** objeto actualizado con `updatedAt` renovado.

---

#### `DELETE /api/profesores/:id`

Elimina un profesor.

> ⚠️ **Falla con `409`** si tiene periodos docentes asociados.

**Respuesta `200`:**

```json
{ "message": "Profesor eliminado correctamente" }
```

---


---

### 📅 Periodos

La colección `periodos` se usa como catálogo oficial para los periodos académicos. El `id` del documento es el mismo valor del periodo, por ejemplo `2026-1`.


**Respuesta `409`:**
```json
{ "message": "Ya existe ese periodo" }
```

---

#### `GET /api/periodos`
Retorna todos los periodos registrados.

**Respuesta `200`:**
```json
[
  {
    "id": "2026-1",
    "periodo": "2026-1",
    "createdAt": "2026-08-25T15:00:00.000Z"
  }
]
```


### 👩‍🏫 Docente Periodos

Esta colección representa la relación entre un profesor y un periodo académico.

#### `POST /api/docente-periodos`
Crea un registro de docente por periodo.

**Body:**
```json
{
  "profesor_id": "prof_123",
  "periodo_id": "2026-1",
  "tipo_vinculacion": "NOMBRADO",
  "dedicacion": "COMPLETO",
  "cargo": "ASOCIADO",
  "estado": "ACTIVO",
  "nivel": "MAESTRIA"
}
```

**Campos obligatorios:**
- `profesor_id`
- `periodo_id`
- `tipo_vinculacion`
- `dedicacion`
- `cargo`

**Campos opcionales:**
- `estado` tiene default `ACTIVO`
- `nivel`

**Respuesta `201`:**
```json
{
  "id": "prof_123_2026-1",
  "profesor_id": "prof_123",
  "periodo_id": "2026-1",
  "tipo_vinculacion": "NOMBRADO",
  "dedicacion": "COMPLETO",
  "cargo": "ASOCIADO",
  "estado": "ACTIVO",
  "nivel": "MAESTRIA",
  "createdAt": "2026-08-25T15:00:00.000Z",
  "periodo": {
    "id": "2026-1",
    "periodo": "2026-1",
    "createdAt": "2026-08-25T15:00:00.000Z"
  }
}
```
Tipos de vinculacion disponibles: 'NOMBRADO', 'CONTRATISTA', 'AD-HONOREM', 'ASISTENTE DOC'

Tipos de dedicacion disponibles: 'COMPLETO', 'PARCIAL', 'H. CATEDRA'

Tipos de cargo disponibles: 'AUXILIAR', 'ASISTENTE', 'ASOCIADO', 'TITULAR', 'SIN CARGO'

Tipos de nivel disponibles: 'PREGRADO', 'MAESTRIA', 'DOCTORADO', 'ESPECIALIZACION']

**Posibles errores:**
- `400` si el profesor no existe
- `400` si el periodo no existe
- `409` si ya existe un registro para ese profesor y periodo

---

#### `GET /api/docente-periodos`
Retorna todos los registros de docente-periodo.

**Respuesta `200`:**
```json
[
  {
    "id": "prof_123_2026-1",
    "profesor_id": "prof_123",
    "periodo_id": "2026-1",
    "tipo_vinculacion": "NOMBRADO",
    "dedicacion": "COMPLETO",
    "cargo": "ASOCIADO",
    "estado": "ACTIVO",
    "nivel": "MAESTRIA",
    "periodo": {
      "id": "2026-1",
      "periodo": "2026-1"
    }
  }
]
```

---

#### `GET /api/docente-periodos/:id`
Retorna un registro por su ID compuesto.

**Ejemplo:** `GET /api/docente-periodos/prof_123_2026-1`

**Respuesta `200`:** objeto del docente-periodo con el periodo expandido. **`404`** si no existe.

---

#### `PUT /api/docente-periodos/:id`
Actualiza parcialmente un registro.

**No se permite actualizar:**
- `profesor_id`
- `periodo_id`

**Body (ejemplo):**
```json
{
  "estado": "INACTIVO",
  "dedicacion": "PARCIAL"
}
```

**Respuesta `200`:** objeto actualizado con el periodo expandido.

**Respuesta `400`:**
```json
{ "message": "No se permite actualizar profesor_id o periodo_id. Elimina y crea un nuevo registro." }
```

---

#### `DELETE /api/docente-periodos/:id`
Elimina un registro de docente-periodo.

**Respuesta `200`:**
```json
{ "message": "DocentePeriodo eliminado correctamente" }
```


## Respuestas de error comunes

| Código | Causa                                                                  |
| ------ | ---------------------------------------------------------------------- |
| `400`  | Validación fallida (Zod) — la respuesta incluye `errors[]` con detalle |
| `400`  | IDs de dependencia referenciados no existen en Firestore               |
| `400`  | No se enviaron campos para actualizar                                  |
| `401`  | Token ausente, expirado o inválido                                     |
| `403`  | Usuario no en lista blanca o inactivo                                  |
| `404`  | Recurso no encontrado                                                  |
| `409`  | Conflicto de integridad referencial                                    |
| `500`  | Error interno del servidor                                             |

**Formato de error de validación (`400`):**

```json
{
  "message": "Error de validacion",
  "errors": [
    {
      "path": ["email"],
      "message": "Debe ser un correo valido"
    }
  ]
}
```

---

### 🧾 Asignaciones

La colección `asignaciones` guarda el detalle de actividades asociadas a un `docente_periodo`.  
El ID del documento se construye automáticamente como:

```txt
<profesor_id>_<docente_periodo_id>
```

#### `POST /api/asignaciones`
Crea una asignación para un profesor en un periodo docente.

**Body:**
```json
{
  "profesor_id": "prof_123",
  "docente_periodo_id": "prof_123_2026-1",
  "tipo_actividad": "Docencia",
  "actividad": "ACTIVIDADES DE DOCENCIA",
  "nombre_actividad": "Cátedra de Bases de Datos",
  "detalle_actividad": "Grupo 01, semestre 2026-1",
  "numero_horas": 8,
  "categoria": "DOCENTE"
}
```

**Campos obligatorios:**
- `profesor_id`
- `docente_periodo_id`
- `tipo_actividad`
- `actividad`
- `nombre_actividad`
- `detalle_actividad`
- `numero_horas`
- `categoria`

**Valores válidos para `tipo_actividad`:**
- `Administrativas`
- `Comisión`
- `Complementarias`
- `Docencia`
- `Investigación`
- `Extensión`
- `Intelectual`
- `Sin actividades`

**Valores válidos para `actividad`:**
- `ACTIVIDADES ADMINISTRATIVAS`
- `ACTIVIDADES COMPLEMENTARIAS`
- `ACTIVIDADES DE DOCENCIA`
- `ACTIVIDADES DE EXTENSIÓN`
- `ACTIVIDADES DE INVESTIGACIÓN`
- `ACTIVIDADES INTELECTUALES O ARTISTICAS`
- `DOCENTE EN COMISIÓN`
- `SIN ACTIVIDADES`

**Respuesta `201`:**
```json
{
  "id": "prof_123_prof_123_2026-1",
  "profesor_id": "prof_123",
  "docente_periodo_id": "prof_123_2026-1",
  "tipo_actividad": "Docencia",
  "actividad": "ACTIVIDADES DE DOCENCIA",
  "nombre_actividad": "Cátedra de Bases de Datos",
  "detalle_actividad": "Grupo 01, semestre 2026-1",
  "numero_horas": 8,
  "categoria": "DOCENTE",
  "createdAt": "2026-08-27T15:00:00.000Z",
  "periodo": {
    "id": "2026-1",
    "periodo": "2026-1",
    "createdAt": "2026-08-25T15:00:00.000Z"
  }
}
```

**Posibles errores:**
- `400` si `profesor_id` no existe
- `400` si `docente_periodo_id` no existe
- `409` si ya existe una asignación para ese profesor y periodo

---

#### `GET /api/asignaciones/profesor/:profesorId`
Retorna todas las asignaciones asociadas a un profesor específico.

**Ejemplo:** `GET /api/asignaciones/profesor/prof_123`

**Respuesta `200`:**
```json
[
  {
    "id": "prof_123_prof_123_2026-1",
    "profesor_id": "prof_123",
    "docente_periodo_id": "prof_123_2026-1",
    "tipo_actividad": "Docencia",
    "actividad": "ACTIVIDADES DE DOCENCIA",
    "nombre_actividad": "Cátedra de Bases de Datos",
    "detalle_actividad": "Grupo 01, semestre 2026-1",
    "numero_horas": 8,
    "categoria": "DOCENTE",
    "periodo": {
      "id": "2026-1",
      "periodo": "2026-1"
    }
  }
]
```

Si el profesor no tiene asignaciones, la respuesta es un arreglo vacío: `[]`.

---

---

## Relación entre modelos

```
Dependencia (ESCUELA/OFICINA)
  └── Dependencia (DEPARTAMENTO)  [padre_id → Escuela]
        └── Dependencia (SECCION) [padre_id → Departamento]

Profesor
  └── dependencia_actual → { escuela_o_oficina_id, departamento_id, seccion_id, ancestros }

DocentePeriodo
  └── profesor_id → Profesor
```


## Reglas de integridad

- No se crea `Profesor` si los IDs en `dependencia_actual` no existen en Firestore.
- No se crea `DocentePeriodo` con `profesor_id` inexistente.
- No se elimina `Dependencia` si tiene hijas o profesores asociados.
- No se elimina `Profesor` si tiene periodos docentes asociados.
- En `DocentePeriodo` no se puede cambiar `profesor_id` ni `periodo` en update (eliminar y recrear).
- En `Asignaciones` no se puede cambiar `profesor_id` ni `docente_periodo_id` en update (eliminar y recrear).