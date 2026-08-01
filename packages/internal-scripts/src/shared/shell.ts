import { $ } from 'bun';

export function runLogged(argv: string[]) {
  console.log(`$ ${argv.map((arg) => $.escape(arg)).join(' ')}`);
  return $`${argv}`;
}
