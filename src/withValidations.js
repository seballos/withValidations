import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * withValidations exposes handleSubmit to the wrapped components
 * @param { Object } validations, the id of the field that will be validation
 * inside a form.
 * @return { Function } return the function which has a Component as parameter
 * which will be rendered
 */
const withValidations = ({ validations, mapFieldtoFields = [] }) => Component => {
  function Validator({ asyncErrors, ...props }) {
    const [errors, setErrors] = useState({})
    const [isDirty, setIsDirty] = useState(false)
    const [firstError, setFirstError] = useState('')

    function getError(value, validators) {
      let error
      const validated = validators.some(validator => {
        error = validator(value)
        return error
      })
      return validated && error
    }
    const handleSubmit = onSubmit => evt => {
      evt.preventDefault()
      const errorsResult = {}
      let hasErrors = false
      Object.keys(validations || {}).forEach(name => {
        const input = Array.from(evt.target).find(element => element.id === name)
        const error = getError(input.value.trim(), validations[name])
        if (error) {
          if (!hasErrors) {
            setFirstError(name)
            hasErrors = true
          }
          errorsResult[name] = { error, submitFailed: true }
        }
      })
      setErrors(errorsResult)
      // validation has errors automatically starts the validation trigger
      // will be enabled every time the field changes, otherwise call the onSubmit
      // action with the proper form values
      if (hasErrors) {
        setIsDirty(true)
      } else {
        const payload = Array.from(evt.target.elements || []).reduce((acc, element) => {
          if (element.name && element.value) {
            acc[element.name] = element.value.trim()
          }
          return acc
        }, {})
        onSubmit(payload)
        setIsDirty(false)
      }
    }

    useEffect(
      () => {
        setErrors(asyncErrors)
      },
      [asyncErrors]
    )

    const onChangeValidation = onChange => evt => {
      let updatedErrors
      const value = onChange(evt)
      const field = evt.target.id || evt.target.name
      const fieldToRemoveErrors = mapFieldtoFields[field] || []
      // Set the errors to the default state
      const sanitizedErrors = fieldToRemoveErrors.reduce((acc, keyError) => {
        acc[keyError] = { error: '' }
        return acc
      }, {})
      updatedErrors = { ...errors, ...sanitizedErrors, [field]: { error: '' } }
      if (isDirty) {
        const validators = validations[field]
        const error = getError(value, validators) || ''
        updatedErrors = { ...updatedErrors, [field]: { error, submitFailed: true } }
      }
      setFirstError('')
      setErrors(updatedErrors)
    }

    return <Component {...props} handleSubmit={handleSubmit} errors={errors} onDirty={onChangeValidation} firstError={firstError} />
  }

  Validator.propTypes = {
    asyncErrors: PropTypes.shape({})
  }

  Validator.defaultProps = {
    asyncErrors: {}
  }

  return Validator
}

export default withValidations
