import rpi_resolve from '@rollup/plugin-node-resolve'

const _cfg_ = { external: [], plugins: [rpi_resolve()] }


export default [
  ... add_src('index'),
  ... add_src('bareuvu'),
  ... add_src('assert'),
  ... add_src('rptr/basic'),
]



function * add_src(src_name, opt={}) {
  const input = `code/${src_name}.mjs`
  yield { ..._cfg_, input,
    output: [{ file: `esm/${src_name}.mjs`, format: 'es', sourcemap: true }]}
}
