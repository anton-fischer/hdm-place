import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ColorPicker from '../../components/color-picker'

vi.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => null }))

describe('ColorPicker', () => {
    it('selects a preset color on click', () => {
        const setSelectedColor = vi.fn()
        const { container } = render(<ColorPicker timeLeft={0} selectedColor="" setSelectedColor={setSelectedColor} />)
        const firstColorButton = container.querySelectorAll('button')[0]
        fireEvent.click(firstColorButton)
        expect(setSelectedColor).toHaveBeenCalledWith('#ff0000')
    })

    it('deselects a preset color when it is already selected', () => {
        const setSelectedColor = vi.fn()
        const { container } = render(<ColorPicker timeLeft={0} selectedColor="#ff0000" setSelectedColor={setSelectedColor} />)
        const firstColorButton = container.querySelectorAll('button')[0]
        fireEvent.click(firstColorButton)
        expect(setSelectedColor).toHaveBeenCalledWith('')
    })

    it('accepts a valid hex color typed into the input', () => {
        const setSelectedColor = vi.fn()
        render(<ColorPicker timeLeft={0} selectedColor="" setSelectedColor={setSelectedColor} />)
        const input = screen.getByPlaceholderText('#ff8800')
        fireEvent.change(input, { target: { value: '#abc123' } })
        expect(setSelectedColor).toHaveBeenCalledWith('#abc123')
    })

    it('ignores an invalid hex color typed into the input', () => {
        const setSelectedColor = vi.fn()
        render(<ColorPicker timeLeft={0} selectedColor="" setSelectedColor={setSelectedColor} />)
        const input = screen.getByPlaceholderText('#ff8800')
        fireEvent.change(input, { target: { value: 'not-a-color' } })
        expect(setSelectedColor).not.toHaveBeenCalled()
    })

    it('shows a formatted HH:MM:SS timer when timeLeft is greater than 0', () => {
        render(<ColorPicker timeLeft={3661} selectedColor="" setSelectedColor={vi.fn()} />)
        expect(screen.getByText('01:01:01')).toBeInTheDocument()
    })

    it('shows the color list instead of the timer when timeLeft is 0', () => {
        render(<ColorPicker timeLeft={0} selectedColor="" setSelectedColor={vi.fn()} />)
        expect(screen.queryByText(/\d{2}:\d{2}:\d{2}/)).not.toBeInTheDocument()
        expect(screen.getByPlaceholderText('#ff8800')).toBeInTheDocument()
    })
})
