import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Sin «globals», Testing Library no limpia solo el DOM entre tests
afterEach(() => cleanup())
