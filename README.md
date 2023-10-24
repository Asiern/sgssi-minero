# Minero SGSSI

## Descripción

Este respositorio continene el código fuente de un minero de criptomonedas para la asignatura de Sistemas de Gestión de la Seguridad de los Sistemas de Información.

## Requisitos

Para la ejecución de este minero es necesario tener instalado algún entorno de ejecución de JavaScript como [Node.js](https://nodejs.org/es/) o [Bun](https://bun.sh/).
(Tener en centa que el rendimiento de este código es mayor en Bun que en Node.js)

## Instalación

Para instalar las dependencias del proyecto ejecutar el siguiente comando (en la raíz del proyecto):

```
npm install
```

## Compialción

Como este proyecto está escrito en TypeScript es necesario compilarlo antes de ejecutarlo. Para ello ejecutar el siguiente comando (en la raíz del proyecto):

```
npm run build
```

Tras ejecutar este comando se generará una carpeta llamada `build` en la raíz del proyecto con el código compilado.

## Ejecución

Una vez compilado el proyecto se puede ejecutar con el siguiente comando (en la raíz del proyecto):

_(En caso de querer utilizar node como entorno de ejecución, sustituir `bun` por `node` en los siguientes comandos)_

El script proporciona los siguientes parámetros:
| Parámetro | Descripción |
| --- | --- |
| help | Muestra la ayuda del programa |
| f1 | Fichero de entrada el bloque a minar/verificar |
| f2 | Fichero de salida (minado)/ Directorio de entrada (verificación)|
| verify | Indica que se va a verificar un directorio |
| mine | Indica que se va a minar un bloque |
|verbose | Indica que se va a mostrar información adicional |
|time| Indica el tiempo máximo de ejecución del minado (en milisegundos)|

Este comando mostrará la ayuda del programa con los parámetros que se pueden pasar al mismo.

```
bun build/main.js --help
```

## Ejemplos de ejecución

A continuación se muestran algunos ejemplos de ejecución del programa:

```
# Verificar directorio de bloques
bun build/main.js --f1 SGSSI-23.CB.03.txt --f2 ./SGSSI-23.S.6.2.CB.03.Candidatos --verify
```

```
# Minar bloque
bun build/main.js --f1 SGSSI-23.CB.02.txt --f2 output.txt --mine
```
