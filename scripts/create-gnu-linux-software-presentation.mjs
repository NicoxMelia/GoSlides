import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const renderedSlides = process.argv[2];
if (!renderedSlides) {
  throw new Error('Uso: node scripts/create-gnu-linux-software-presentation.mjs <directorio-con-pngs>');
}

const presentationRoot = path.join(root, 'examples', 'gnu-linux-software-presentation');
const slidesRoot = path.join(presentationRoot, 'slides');
const assetsRoot = path.join(presentationRoot, 'assets');
fs.mkdirSync(slidesRoot, { recursive: true });
fs.mkdirSync(assetsRoot, { recursive: true });

const sourceTitles = [
  'Sistemas Operativos I: Intro to GNU-Linux Software',
  'Agenda',
  'Intro to GNU-Linux Software',
  'The GNU C Library',
  'The Argument List',
  'GNU/Linux Command-Line Conventions',
  'Options',
  'Using getopt_long',
  'Standard I/O',
  'Standard I/O: file descriptors',
  'Standard I/O with a pipe',
  'Flushing stdout',
  'Redirect stdout and stderr',
  'Program exit codes',
  'The environment',
  'The environment: export and libc',
  'The environment: example',
  'Linux system calls',
  'System calls',
  'General points of system calls',
  'Execution of a system call: wrapper',
  'Execution of a system call: trap',
  'Execution of a system call: kernel handler',
  'Execution of a system call: return and errno',
  'Example of execve(): user mode',
  'Example of execve(): kernel mode',
  'Coding Defensively',
  'Using assert',
  'Using assert: examples',
  'System Call Failures',
  'System Call Failures: interrupted calls',
  'Error codes from System Calls',
  'Error codes: EINTR',
  'Errors and Resource Allocation',
  'Recursos',
  'Preguntas',
];

function sourceSection(sourceNumber) {
  if (sourceNumber <= 2) return 'introduccion';
  if (sourceNumber <= 17) return 'glibc';
  if (sourceNumber <= 26) return 'syscalls';
  return 'defensive';
}

function sourceSlide(sourceNumber) {
  const sourceName = `source-slide-${String(sourceNumber).padStart(2, '0')}.png`;
  const input = path.join(renderedSlides, `slide-${String(sourceNumber).padStart(2, '0')}.png`);
  if (!fs.existsSync(input)) throw new Error(`No existe ${input}`);
  fs.copyFileSync(input, path.join(assetsRoot, sourceName));
  return {
    id: `original-${String(sourceNumber).padStart(2, '0')}`,
    layout: 'free',
    sectionId: sourceSection(sourceNumber),
    transition: 'none',
    canvas: [
      {
        id: `original-image-${String(sourceNumber).padStart(2, '0')}`,
        type: 'image',
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        src: `assets/${sourceName}`,
        fit: 'cover',
        alt: `Diapositiva original ${sourceNumber}: ${sourceTitles[sourceNumber - 1]}`,
        locked: true,
        layerName: 'Diapositiva original',
      },
    ],
    notes: [
      `Copia visual de la diapositiva ${sourceNumber} del archivo l3_gnu_linux_software_2026.pptx.`,
    ],
  };
}

function codeSlide({ id, sectionId, eyebrow, title, subtitle, language = 'c', file, code, output, note }) {
  return {
    id,
    layout: 'default',
    masterId: 'master-code',
    sectionId,
    transition: 'wipe',
    eyebrow,
    title,
    subtitle,
    blocks: [
      {
        type: 'code',
        language,
        title: file,
        code,
        frameStyle: language === 'bash' ? 'terminal' : 'carbon-light',
        codeTheme: language === 'bash' ? 'tokyo-night' : 'github-dark',
        showLineNumbers: true,
        showWindowControls: true,
        simulationEnabled: true,
        simulationOutput: output,
        animation: 'slide-up',
      },
    ],
    notes: [note, 'Usar Run code para reproducir la salida simulada dentro de la diapositiva.'],
  };
}

// Los ejemplos largos necesitan una región de altura explícita: así el código
// conserva su escala, entra completo y la terminal simulada abre dentro del marco
// en vez de empujar el contenido por debajo del lienzo 16:9.
function fittedCodeSlide(options) {
  const slide = codeSlide(options);
  const [codeBlock] = slide.blocks;
  const { animation, ...block } = codeBlock;
  return {
    id: slide.id,
    layout: 'free',
    masterId: slide.masterId,
    sectionId: slide.sectionId,
    transition: slide.transition,
    canvas: [
      {
        id: `${slide.id}-eyebrow`,
        type: 'text',
        x: 7.2,
        y: 6.2,
        w: 75,
        h: 3,
        zIndex: 2,
        layerName: 'Eyebrow',
        text: slide.eyebrow,
        style: { color: '#0099B0', fontSize: 7, fontWeight: 700, letterSpacing: 1.2 },
      },
      {
        id: `${slide.id}-title`,
        type: 'text',
        x: 7.2,
        y: 10.2,
        w: 80,
        h: 8,
        zIndex: 2,
        layerName: 'Título',
        text: slide.title,
        style: { color: '#111111', fontSize: 38, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1.2 },
      },
      {
        id: `${slide.id}-subtitle`,
        type: 'text',
        x: 7.2,
        y: 19.2,
        w: 82,
        h: 4.2,
        zIndex: 2,
        layerName: 'Subtítulo',
        text: slide.subtitle,
        style: { color: '#5F6368', fontSize: 13, fontWeight: 400, lineHeight: 1.4 },
      },
      {
        id: `${slide.id}-code`,
        type: 'block',
        x: 7.2,
        y: 25.5,
        w: 85.6,
        h: 67.5,
        zIndex: 2,
        layerName: 'Código ejecutable',
        fit: 'stretch',
        style: { fontSize: 25 },
        animation,
        block,
      },
    ],
    notes: slide.notes,
  };
}

const additions = new Map([
  [5, codeSlide({
    id: 'codigo-argc-argv',
    sectionId: 'glibc',
    eyebrow: 'EJEMPLO 01 · ARGUMENTOS',
    title: 'Argumentos disponibles en argc y argv',
    subtitle: 'El primer elemento identifica el programa. Los siguientes conservan el orden escrito en la terminal.',
    file: 'argv.c',
    code: `#include <stdio.h>

int main(int argc, char *argv[]) {
    printf("argc = %d\\n", argc);

    for (int i = 0; i < argc; i++) {
        printf("argv[%d] = \\\"%s\\\"\\n", i, argv[i]);
    }

    return 0;
}`,
    output: `$ gcc -Wall -Wextra -std=c17 argv.c -o argv
$ ./argv --verbose archivo.txt
argc = 3
argv[0] = "./argv"
argv[1] = "--verbose"
argv[2] = "archivo.txt"`,
    note: 'Remarcar que argc siempre incluye argv[0] cuando el programa se invoca normalmente.',
  })],
  [8, fittedCodeSlide({
    id: 'codigo-getopt-long',
    sectionId: 'glibc',
    eyebrow: 'EJEMPLO 02 · OPCIONES',
    title: 'Opciones con getopt_long',
    subtitle: 'La misma rama del switch atiende la forma corta y la forma larga.',
    file: 'options.c',
    code: `#include <getopt.h>
#include <stdio.h>

int main(int argc, char **argv) {
    static const struct option options[] = {
        {"help",    no_argument,       NULL, 'h'},
        {"output",  required_argument, NULL, 'o'},
        {"verbose", no_argument,       NULL, 'v'},
        {NULL, 0, NULL, 0}
    };
    const char *output = "stdout";
    int verbose = 0, opt;

    while ((opt = getopt_long(argc, argv, "ho:v", options, NULL)) != -1) {
        switch (opt) {
            case 'h': puts("uso: options [-v] [-o archivo]"); return 0;
            case 'o': output = optarg; break;
            case 'v': verbose = 1; break;
            default: return 2;
        }
    }
    printf("output=%s verbose=%d restante=%d\\n",
           output, verbose, argc - optind);
    return 0;
}`,
    output: `$ gcc -Wall -Wextra -std=c17 options.c -o options
$ ./options --verbose -o resultado.txt entrada.dat
output=resultado.txt verbose=1 restante=1`,
    note: 'Mostrar que optarg contiene resultado.txt y que optind señala entrada.dat.',
  })],
  [11, codeSlide({
    id: 'codigo-streams',
    sectionId: 'glibc',
    eyebrow: 'EJEMPLO 03 · E/S ESTÁNDAR',
    title: 'Separación de stdout y stderr',
    subtitle: 'Los datos útiles y los diagnósticos pueden redirigirse por separado.',
    file: 'streams.c',
    code: `#include <stdio.h>

int main(void) {
    puts("resultado: 42");
    fprintf(stderr, "diagnostico: entrada incompleta\\n");
    return 0;
}`,
    output: `$ gcc -Wall -Wextra -std=c17 streams.c -o streams
$ ./streams >salida.txt 2>errores.txt
$ cat salida.txt
resultado: 42
$ cat errores.txt
diagnostico: entrada incompleta`,
    note: 'Comparar los descriptores 1 y 2 con las redirecciones del shell.',
  })],
  [12, codeSlide({
    id: 'codigo-flush',
    sectionId: 'glibc',
    eyebrow: 'EJEMPLO 04 · BUFFERING',
    title: 'Control del búfer de stdout',
    subtitle: 'fflush hace visible cada punto sin esperar el salto de línea ni la finalización del proceso.',
    file: 'progress.c',
    code: `#include <stdio.h>
#include <unistd.h>

int main(void) {
    for (int i = 0; i < 3; i++) {
        printf(".");
        fflush(stdout);
        sleep(1);
    }
    putchar('\\n');
    return 0;
}`,
    output: `$ gcc -Wall -Wextra -std=c17 progress.c -o progress
$ ./progress
.
..
...
Simulación: cada punto aparece con un segundo de diferencia.`,
    note: 'La terminal simulada expresa el cambio temporal en líneas separadas para hacerlo observable.',
  })],
  [14, codeSlide({
    id: 'codigo-exit-status',
    sectionId: 'glibc',
    eyebrow: 'EJEMPLO 05 · SHELL',
    title: 'Redirección y código de salida',
    subtitle: 'El script conserva el estado del programa después de guardar cada stream en un archivo distinto.',
    language: 'bash',
    file: 'ejecutar.sh',
    code: `#!/usr/bin/env bash

./procesar datos.csv >resultado.txt 2>errores.txt
status=$?

if (( status != 0 )); then
  printf 'procesar falló con código %d\\n' "$status" >&2
fi

exit "$status"`,
    output: `$ chmod +x ejecutar.sh
$ ./ejecutar.sh
procesar falló con código 2
$ echo $?
2
$ cat errores.txt
datos.csv: formato inválido en la línea 7`,
    note: 'Guardar $? inmediatamente evita que otro comando sobrescriba el código que queremos propagar.',
  })],
  [17, codeSlide({
    id: 'codigo-environment',
    sectionId: 'glibc',
    eyebrow: 'EJEMPLO 06 · ENTORNO',
    title: 'Configuración con variables de entorno',
    subtitle: 'getenv permite usar una configuración externa y mantener un valor predeterminado.',
    file: 'client.c',
    code: `#include <stdio.h>
#include <stdlib.h>

int main(void) {
    const char *server = getenv("SERVER_NAME");

    if (server == NULL || server[0] == '\\0') {
        server = "localhost";
    }

    printf("conectando a %s\\n", server);
    return 0;
}`,
    output: `$ gcc -Wall -Wextra -std=c17 client.c -o client
$ ./client
conectando a localhost
$ SERVER_NAME=api.lab.local ./client
conectando a api.lab.local`,
    note: 'La asignación escrita antes del comando modifica el entorno solamente para esa ejecución.',
  })],
  [20, codeSlide({
    id: 'codigo-write-syscall',
    sectionId: 'syscalls',
    eyebrow: 'EJEMPLO 07 · SYSTEM CALL',
    title: 'Una llamada al sistema con write',
    subtitle: 'La función write devuelve la cantidad transferida o -1 cuando la operación falla.',
    file: 'write_demo.c',
    code: `#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

int main(void) {
    const char message[] = "hola desde write\\n";
    ssize_t written = write(STDOUT_FILENO, message, sizeof message - 1);

    if (written == -1) {
        fprintf(stderr, "write: %s\\n", strerror(errno));
        return 1;
    }

    printf("bytes escritos: %zd\\n", written);
    return 0;
}`,
    output: `$ gcc -Wall -Wextra -std=c17 write_demo.c -o write_demo
$ ./write_demo
hola desde write
bytes escritos: 17`,
    note: 'write trabaja con el descriptor 1. printf usa el stream stdout de la biblioteca C.',
  })],
  [26, codeSlide({
    id: 'codigo-execve',
    sectionId: 'syscalls',
    eyebrow: 'EJEMPLO 08 · EXECVE',
    title: 'Reemplazo del proceso con execve',
    subtitle: 'Si execve tiene éxito, el código ubicado después de la llamada no vuelve a ejecutarse.',
    file: 'exec_demo.c',
    code: `#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

extern char **environ;

int main(void) {
    char *const args[] = {
        "printf", "proceso reemplazado\\n", NULL
    };

    execve("/usr/bin/printf", args, environ);
    perror("execve");
    return EXIT_FAILURE;
}`,
    output: `$ gcc -Wall -Wextra -std=c17 exec_demo.c -o exec_demo
$ ./exec_demo
proceso reemplazado
$ echo $?
0`,
    note: 'perror solamente se ejecuta si execve devuelve -1.',
  })],
  [29, codeSlide({
    id: 'codigo-assert',
    sectionId: 'defensive',
    eyebrow: 'EJEMPLO 09 · ASSERT',
    title: 'Assert para invariantes internas',
    subtitle: 'La precondición documenta un error de programación. La entrada del usuario requiere otra validación.',
    file: 'average.c',
    code: `#include <assert.h>
#include <stdio.h>

double average(const int *values, size_t count) {
    assert(values != NULL);
    assert(count > 0);

    long sum = 0;
    for (size_t i = 0; i < count; i++) sum += values[i];
    return (double) sum / count;
}

int main(void) {
    int values[] = {4, 6, 8};
    printf("promedio: %.2f\\n", average(values, 3));
    return 0;
}`,
    output: `$ gcc -Wall -Wextra -std=c17 average.c -o average
$ ./average
promedio: 6.00
$ gcc -DNDEBUG -std=c17 average.c -o average-release
Compilación release: las expresiones de assert quedan desactivadas.`,
    note: 'No pasar datos inválidos sólo para provocar un crash durante la demostración. Explicar la diferencia con validación de entrada.',
  })],
  [33, codeSlide({
    id: 'codigo-eintr',
    sectionId: 'defensive',
    eyebrow: 'EJEMPLO 10 · ERRNO',
    title: 'Reintentos ante EINTR',
    subtitle: 'El bucle repite read sólo cuando una señal interrumpió la operación.',
    file: 'read_retry.c',
    code: `#include <errno.h>
#include <unistd.h>

ssize_t read_retry(int fd, void *buffer, size_t size) {
    ssize_t result;

    do {
        result = read(fd, buffer, size);
    } while (result == -1 && errno == EINTR);

    return result;
}`,
    output: `$ gcc -Wall -Wextra -std=c17 -c read_retry.c
Simulación de la secuencia:
read(...) = -1, errno = EINTR
read(...) = 5
resultado final = 5 bytes`,
    note: 'Otros valores de errno salen del bucle y deben tratarse como fallas reales.',
  })],
  [34, codeSlide({
    id: 'codigo-cleanup',
    sectionId: 'defensive',
    eyebrow: 'EJEMPLO 11 · RECURSOS',
    title: 'Un único camino de limpieza',
    subtitle: 'Cada recurso se libera una sola vez, tanto en el camino normal como después de una falla.',
    file: 'load_file.c',
    code: `#include <stdio.h>
#include <stdlib.h>

int load_file(const char *path) {
    int status = 1;
    FILE *file = fopen(path, "r");
    char *buffer = NULL;

    if (file == NULL) { perror("fopen"); goto cleanup; }
    buffer = malloc(4096);
    if (buffer == NULL) { perror("malloc"); goto cleanup; }

    status = 0;  // procesar file usando buffer

cleanup:
    free(buffer);
    if (file != NULL) fclose(file);
    return status;
}`,
    output: `$ gcc -Wall -Wextra -std=c17 -c load_file.c
Compilación completada sin advertencias.
Camino exitoso: free + fclose
Falla de malloc: fclose
Falla de fopen: no hay recursos que liberar`,
    note: 'El patrón goto cleanup reduce duplicación y evita olvidar recursos en una salida temprana.',
  })],
]);

const orderedSlides = [];
for (let sourceNumber = 1; sourceNumber <= sourceTitles.length; sourceNumber++) {
  orderedSlides.push(sourceSlide(sourceNumber));
  const addition = additions.get(sourceNumber);
  if (addition) orderedSlides.push(addition);
}

const slidePaths = [];
orderedSlides.forEach((slide, index) => {
  const sequence = String(index + 1).padStart(2, '0');
  const relative = `slides/${sequence}-${slide.id}.json`;
  fs.writeFileSync(path.join(presentationRoot, relative), `${JSON.stringify(slide, null, 2)}\n`);
  slidePaths.push(relative);
});

const manifest = {
  format: 'goslides',
  version: 2,
  id: 'gnu-linux-software-2026',
  publicId: 'gnuLinuxSoftware2026',
  title: 'Intro to GNU-Linux Software',
  subtitle: 'Sistemas Operativos I · teoría original y ejemplos ejecutables',
  description: 'Las 36 diapositivas de la clase original, conservadas visualmente, más 11 ejemplos de C y Bash con simulación de ejecución dentro de GoSlides.',
  author: 'Ingeniería en Computación · FCEFyN · UNC',
  tags: ['GNU/Linux', 'glibc', 'C', 'system calls', 'programación defensiva', 'Sistemas Operativos I'],
  authoring: {
    density: 'detailed',
    depth: 'class',
    interaction: 'frequent',
    overflowStrategy: 'preserve',
    durationMinutes: 75,
    preserveSourceMaterial: true,
  },
  theme: {
    mode: 'light',
    accent: '#0099B0',
    fontFamily: 'Arial, Liberation Sans, ui-sans-serif, sans-serif',
    headingFontFamily: 'Arial, Liberation Sans, ui-sans-serif, sans-serif',
    slideBackground: '#FFFFFF',
    surfaceColor: '#F3F5F6',
    textColor: '#111111',
    mutedColor: '#5F6368',
    radius: 0,
    tokens: {
      spacing: 16,
      cardRadius: 10,
      shadowStrength: 12,
      borderColor: '#D6DADD',
    },
    visualStyle: 'modern',
    iconLibrary: 'lucide',
  },
  masters: [
    {
      id: 'master-code',
      name: 'Ejemplo ejecutable',
      background: 'linear-gradient(180deg,#ffffff,#f7fafb)',
      footer: 'SISTEMAS OPERATIVOS I · GNU/LINUX · EJEMPLO EJECUTABLE',
      canvas: [
        {
          id: 'code-accent',
          type: 'shape',
          shape: 'rounded',
          x: 4.2,
          y: 5.2,
          w: 0.55,
          h: 8.2,
          locked: true,
          layerName: 'Acento',
          style: {
            background: '#0099B0',
            borderRadius: 4,
          },
        },
      ],
    },
  ],
  sections: [
    { id: 'introduccion', name: 'Introducción' },
    { id: 'glibc', name: 'The GNU C Library' },
    { id: 'syscalls', name: 'Linux System Calls' },
    { id: 'defensive', name: 'Coding Defensively' },
  ],
  cover: 'assets/source-slide-01.png',
  slides: slidePaths,
};

fs.writeFileSync(path.join(presentationRoot, 'presentation.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Created ${presentationRoot} with ${orderedSlides.length} slides`);
