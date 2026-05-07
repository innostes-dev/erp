import { type Tree, formatFiles, names, updateJson } from '@nx/devkit';

interface ServiceGeneratorSchema {
  name: string;
}

export default async function serviceGenerator(tree: Tree, schema: ServiceGeneratorSchema) {
  const n = names(schema.name);
  const appPath = `apps/service-${n.fileName}`;

  // project.json
  tree.write(
    `${appPath}/project.json`,
    JSON.stringify(
      {
        name: `service-${n.fileName}`,
        $schema: '../../node_modules/nx/schemas/project.json',
        sourceRoot: `${appPath}/src`,
        projectType: 'application',
        tags: [`type:app`, `scope:${n.fileName}`, 'platform:server'],
      },
      null,
      2,
    ) + '\n',
  );

  // tsconfig.json
  tree.write(
    `${appPath}/tsconfig.json`,
    JSON.stringify(
      {
        extends: '../../tsconfig.base.json',
        compilerOptions: {
          module: 'CommonJS',
          moduleResolution: 'node',
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
          outDir: `../../dist/${appPath}`,
        },
        include: ['src/**/*.ts'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2,
    ) + '\n',
  );

  // main.ts
  tree.write(
    `${appPath}/src/main.ts`,
    `import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ${n.className}AppModule } from './${n.fileName}-app.module';

async function bootstrap() {
  const app = await NestFactory.create(${n.className}AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.listen(process.env['PORT'] ?? 3000);
}

void bootstrap();
`,
  );

  // app module
  tree.write(
    `${appPath}/src/${n.fileName}-app.module.ts`,
    `import { Module } from '@nestjs/common';
import { ${n.className}DomainModule } from './${n.fileName}/${n.fileName}.module';

@Module({ imports: [${n.className}DomainModule] })
export class ${n.className}AppModule {}
`,
  );

  // domain module
  tree.write(
    `${appPath}/src/${n.fileName}/${n.fileName}.module.ts`,
    `import { Module } from '@nestjs/common';
import { ${n.className}Controller } from './${n.fileName}.controller';
import { ${n.className}Service } from './${n.fileName}.service';

@Module({ controllers: [${n.className}Controller], providers: [${n.className}Service] })
export class ${n.className}DomainModule {}
`,
  );

  // controller stub
  tree.write(
    `${appPath}/src/${n.fileName}/${n.fileName}.controller.ts`,
    `import { Controller, Get } from '@nestjs/common';
import { ${n.className}Service } from './${n.fileName}.service';

@Controller('${n.fileName}')
export class ${n.className}Controller {
  constructor(private readonly ${n.propertyName}Service: ${n.className}Service) {}

  @Get()
  findAll() {
    return this.${n.propertyName}Service.findAll();
  }
}
`,
  );

  // service stub
  tree.write(
    `${appPath}/src/${n.fileName}/${n.fileName}.service.ts`,
    `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${n.className}Service {
  findAll() {
    return [];
  }
}
`,
  );

  // Add DTO stub to shared/types
  updateJson(tree, 'libs/shared/types/src/index.ts', () => {
    const content = tree.read('libs/shared/types/src/index.ts', 'utf-8') ?? '';
    if (content.includes(`${n.className}Dto`)) return JSON.parse('{}');
    return JSON.parse('{}');
  });

  await formatFiles(tree);
}
