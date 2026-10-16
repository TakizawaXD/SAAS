# DOTNET_AUDIT

## 1. Tecnologías y versiones
- **.NET**: Proyecto basado en .NET 7 (asumido por SDK files). 
- **IDE**: Visual Studio / Rider (sln file present).
- **UI**: WPF (Proyecto `FacturaPro360.Wpf`).
- **Arquitectura**: Carpetas `Application`, `Domain`, `Infrastructure` indican una arquitectura basada en Clean Architecture / DDD.

## 2. Estructura de carpetas
```
FacturaPro360-Desktop/
├─ src/
│  ├─ FacturaPro360.Application/
│  ├─ FacturaPro360.Domain/
│  ├─ FacturaPro360.Infrastructure/
│  └─ FacturaPro360.Wpf/
├─ publish/
├─ tests/
├─ FacturaPro360.sln
└─ README.md
```

## 3. Arquitectura
- **Domain**: Entidades de negocio (Empresa, Usuario, Factura, Producto, Cliente, etc.).
- **Application**: Casos de uso / servicios de aplicación que coordinan la lógica de negocio.
- **Infrastructure**: Implementaciones de repositorios, acceso a datos (Supabase/PostgreSQL) y servicios externos.
- **Wpf**: Presentación de escritorio (MVVM). La UI probablemente contiene ViewModels que consumen los servicios de `Application`.

## 4. Base de datos
- **Supabase** (PostgreSQL) es la fuente de verdad. El script `supabase_setup_completo.sql` define tablas y políticas RLS.
- **Conexión**: Se espera una cadena de conexión en `appsettings.json` bajo la clave `Supabase:ConnectionString` (valor real será ocultado).

## 5. Modelos / Entidades
> **Pendiente**: Revisar los archivos dentro de `Domain` para enumerar exactas clases de entidad.

## 6. Endpoints y contratos API
- La versión web usa Supabase Auth y el cliente de Supabase JS. No hay API propiamente dicho; la app .NET deberá consumir directamente la base de datos vía cliente PostgreSQL o la API REST de Supabase.

## 7. Sistema de autenticación
- **Web**: Supabase Auth (email/password, JWT). 
- **Desktop**: Se necesita un cliente que invoque los endpoints de Supabase Auth (`/auth/v1/token?grant_type=password`).

## 8. Registro y gestión de usuarios
- Los flujos de registro, recuperación de contraseña y asociación de usuarios a empresas están presentes en la web (`src/app/components/auth/*`). Estos deben replicarse en .NET mediante llamadas a la API de Supabase Auth.

## 9. Roles y permisos
- Basados en RLS policies definidas en `supabase/migrations/001_initial_schema.sql` y `002_rls_policies.sql`. Los roles (`admin`, `owner`, `employee`) están almacenados en tabla `roles` y evaluados en cada consulta.

## 10. Módulos existentes (Web)
- **Dashboard**
- **Facturas**
- **Productos**
- **Clientes**
- **Compras**
- **Caja / Bancos**
- **Informes**
- **Auditoría**
- **Configuración** (incluye cambio de logo)

## 11. Dependencias
- `Npgsql` para PostgreSQL.
- `Supabase.Client` (si existe) o SDK propio.
- `CommunityToolkit.Mvvm` para MVVM en WPF.

## 12. Pruebas disponibles
- Carpeta `tests` contiene proyectos de pruebas unitarias y de integración (ejemplo `FacturaPro360.Tests`). Revisar para entender cobertura actual.

## 13. Observaciones preliminares
- El proyecto ya está estructurado para una aplicación comercial; falta implementar la capa de acceso a Supabase y los flujos de autenticación.
- Se debe añadir configuración de despliegue (instalador, firma de código, CI/CD).
- La UI debe incorporar los componentes de instalación y cambio de logo descritos en peticiones anteriores (modal de instalación, botón de logo en Configuración).

---

*Este documento es un punto de partida; será ampliado a medida que se inspeccionen los archivos reales del proyecto.*
