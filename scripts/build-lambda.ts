import {build} from 'esbuild';
import {execSync} from 'child_process';
import {mkdirSync} from 'fs';
import {join} from 'path';
import {program} from 'commander';

const main = async () => {
  program
    .option('-l, --lambda <name>', 'Lambda to build (auth, send), omit for all')
    .parse(process.argv);

  const {lambda} = program.opts();
  const allLambdas = ['auth', 'send', 'upload', 'webhook'];
  const lambdas = lambda ? [lambda] : allLambdas;

  if (lambda && !allLambdas.includes(lambda)) {
    console.error(
      `Unknown lambda: ${lambda}. Must be one of: ${allLambdas.join(', ')}`,
    );
    process.exit(1);
  }

  for (const name of lambdas) {
    const outdir = `apps/serverless/${name}/dist`;
    mkdirSync(outdir, {recursive: true});

    await build({
      entryPoints: [`apps/serverless/${name}/src/index.ts`],
      bundle: true,
      platform: 'node',
      target: 'node22',
      outfile: `${outdir}/index.js`,
      external: [],
      minify: true,
      sourcemap: false,
    });

    execSync(
      `powershell Compress-Archive -Path ${join(outdir, 'index.js')} -DestinationPath ${join(outdir, 'main.zip')} -Force`,
    );

    console.log(`✅ Built and zipped ${name}`);
  }
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
