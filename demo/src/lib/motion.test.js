import test from 'node:test'
import assert from 'node:assert/strict'

import {
  CARD_LIFT_VARIANTS,
  POSTER_VARIANTS,
  SHAKE_STEPS,
  SPRINGS,
  cardMotion,
  commentItemMotion,
  fieldErrorMotion,
  gridItemMotion,
  pageMotion,
  pressMotion,
  progressFromScore,
  scrollLift,
  staggerDelay,
  statusMotion,
} from './motion.js'

function assertSpring(transition, label) {
  assert.ok(transition, `${label} tiene transición`)
  assert.equal(transition.type, 'spring', `${label} usa un spring real`)
  assert.equal(typeof transition.stiffness, 'number', `${label} declara stiffness`)
  assert.equal(typeof transition.damping, 'number', `${label} declara damping`)
  assert.equal('ease' in transition, false, `${label} no usa easing de CSS`)
  assert.equal('cubicBezier' in transition, false, `${label} no usa cubic-bezier`)
}

test('todos los presets son springs reales, sin easing de CSS', () => {
  const names = Object.keys(SPRINGS)
  assert.ok(names.length >= 6, 'hay presets para cada interacción')

  for (const name of names) {
    assertSpring(SPRINGS[name], `SPRINGS.${name}`)
    assert.ok(SPRINGS[name].stiffness > 0, `SPRINGS.${name}.stiffness es positivo`)
    assert.ok(SPRINGS[name].damping > 0, `SPRINGS.${name}.damping es positivo`)
  }
})

test('el spring de la grilla pesa lo pedido: stiffness 220-320, damping 26-34', () => {
  assert.ok(SPRINGS.grid.stiffness >= 220 && SPRINGS.grid.stiffness <= 320)
  assert.ok(SPRINGS.grid.damping >= 26 && SPRINGS.grid.damping <= 34)
})

test('el spring del score no rebota sobre el progreso', () => {
  const { stiffness, damping, mass = 1 } = SPRINGS.score
  const criticalDamping = 2 * Math.sqrt(stiffness * mass)
  assert.ok(damping >= criticalDamping, 'amortiguado o sobreamortiguado: no pasa de 100%')
})

test('staggerDelay escalona por índice y se corta en el tope', () => {
  assert.equal(staggerDelay(0), 0)
  assert.ok(staggerDelay(1) > 0)
  assert.ok(staggerDelay(3) > staggerDelay(2))
  assert.equal(staggerDelay(50), staggerDelay(9))
  assert.equal(staggerDelay(-4), 0)
  assert.equal(staggerDelay(Number.NaN), 0)
  assert.equal(staggerDelay(2.8), staggerDelay(2))
})

test('progressFromScore lleva el score a 0..1 y aguanta datos inválidos', () => {
  assert.equal(progressFromScore(0), 0)
  assert.equal(progressFromScore(10), 1)
  assert.equal(progressFromScore(8.4), 0.84)
  assert.equal(progressFromScore(12), 1)
  assert.equal(progressFromScore(-3), 0)
  assert.equal(progressFromScore('7.5'), 0.75)
  assert.equal(progressFromScore('sin dato'), 0)
  assert.equal(progressFromScore(undefined), 0)
  assert.equal(progressFromScore(5, 20), 0.25)
})

test('scrollLift traduce el scroll a 0..1 según la distancia del header', () => {
  assert.equal(scrollLift(0), 0)
  assert.equal(scrollLift(-20), 0)
  assert.equal(scrollLift(36, 72), 0.5)
  assert.equal(scrollLift(200, 72), 1)
  assert.equal(scrollLift(undefined), 0)
})

test('gridItemMotion escalona la entrada y se apaga con reduced motion', () => {
  const full = gridItemMotion(2, false)
  assert.ok(full.initial.y > 0, 'entra desplazada')
  assert.equal(full.initial.opacity, 0)
  assert.equal(full.animate.y, 0)
  assert.equal(full.animate.opacity, 1)
  assertSpring(full.animate.transition, 'gridItemMotion().animate')
  assert.equal(full.animate.transition.delay, staggerDelay(2))
  assertSpring(full.exit.transition, 'gridItemMotion().exit')

  const still = gridItemMotion(2, true)
  assert.equal('y' in still.initial, false, 'sin transform inicial')
  assert.equal(still.animate.opacity, 1)
  assert.equal('y' in still.animate, false)
  assert.equal(still.exit.transition.duration, 0, 'sale sin animación')
})

test('pageMotion coordina la salida y no deja transforms con reduced motion', () => {
  const full = pageMotion(false)
  assertSpring(full.animate.transition, 'pageMotion().animate')
  assertSpring(full.exit.transition, 'pageMotion().exit')
  assert.ok(full.initial.y > 0)

  const still = pageMotion(true)
  assert.equal(still.initial, false)
  assert.equal('y' in still.animate, false)
  assert.equal(still.exit.transition.duration, 0)
})

test('commentItemMotion, fieldErrorMotion y statusMotion respetan reduced motion', () => {
  for (const build of [commentItemMotion, fieldErrorMotion, statusMotion]) {
    const full = build(false)
    assertSpring(full.animate.transition, `${build.name}()`)
    assert.equal(full.animate.y, 0)
    assert.equal(full.animate.opacity, 1)
    assert.ok(full.initial.y > 0 || full.initial.y < 0)

    const still = build(true)
    assert.equal(still.initial, false)
    assert.equal('y' in still.animate, false)
    assert.equal('scale' in still.animate, false)
  }
})

test('cardMotion sólo eleva con puntero fino y se apaga con reduced motion', () => {
  const fine = cardMotion({ reduced: false, finePointer: true })
  assert.equal(fine.whileHover, 'hover')
  assertSpring(fine.variants.hover.transition, 'cardMotion().variants.hover')
  assertSpring(fine.variants.tap.transition, 'cardMotion().variants.tap')
  assert.ok(fine.variants.hover.y < 0, 'el hover eleva')
  assert.ok(fine.variants.tap.scale < 1, 'el tap hunde un poco')
  assert.ok(SPRINGS.tap.stiffness > SPRINGS.card.stiffness, 'el tap es más rígido')

  const coarse = cardMotion({ reduced: false, finePointer: false })
  assert.equal(coarse.whileHover, undefined)
  assert.equal(coarse.whileTap, 'tap')

  const still = cardMotion({ reduced: true, finePointer: true })
  assert.equal(still.whileHover, undefined)
  assert.equal(still.whileTap, undefined)
  assert.equal(still.whileFocus, undefined)
  assert.equal(still.variants.hover.y, 0)
})

test('los variants del poster y del halo son springs y no tocan filter ni box-shadow', () => {
  for (const variants of [POSTER_VARIANTS, CARD_LIFT_VARIANTS]) {
    for (const [state, values] of Object.entries(variants)) {
      if (state === 'rest') continue
      assertSpring(values.transition, `variants.${state}`)
      assert.equal('filter' in values, false)
      assert.equal('boxShadow' in values, false)
    }
  }
  assert.ok(POSTER_VARIANTS.hover.scale > 1)
  assert.equal(CARD_LIFT_VARIANTS.rest.opacity, 0)
  assert.ok(CARD_LIFT_VARIANTS.hover.opacity > 0)
})

test('pressMotion da feedback al tap y se apaga con reduced motion', () => {
  const full = pressMotion(false)
  assertSpring(full.whileTap.transition, 'pressMotion().whileTap')
  assert.ok(full.whileTap.scale < 1)

  const still = pressMotion(true)
  assert.equal(still.whileTap, undefined)
})

test('el shake de validación arranca y termina en reposo', () => {
  assert.ok(SHAKE_STEPS.length >= 3)
  assert.equal(SHAKE_STEPS[0] === 0, false, 'arranca desplazado')
  assert.equal(SHAKE_STEPS.at(-1), 0, 'vuelve a 0: no queda transform colgado')
  assert.ok(SHAKE_STEPS.every((step) => Number.isFinite(step) && Math.abs(step) <= 12))
})
