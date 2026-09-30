import { createElement } from 'react'
import { Routes, Route } from 'react-router-dom'
import { public_page } from '../../page/public/public_page'

export function app_router() {
  return createElement(
    Routes,
    null,
    createElement(Route, { path: '*', element: createElement(public_page) })
  )
}
