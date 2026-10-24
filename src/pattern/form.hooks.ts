import { createFormHook, revalidateLogic, type AnyFormApi } from '@tanstack/react-form'
import * as v from 'valibot'
import { isFriendlyError } from '@core/http'
import {
  CheckboxField,
  PasswordField,
  FormErrorAlert,
  NumberField,
  RadioGroupField,
  SelectField,
  SubmitButton,
  TextareaField,
  TextField,
} from '@pattern/form'
import { fieldContext, formContext } from '@pattern/form.contexts'

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, PasswordField, NumberField, TextareaField, SelectField, RadioGroupField, CheckboxField },
  formComponents: { SubmitButton, FormErrorAlert },
})

export const schemaValidation = <TSchema extends v.GenericSchema>(schema: TSchema) => ({
  validationLogic: revalidateLogic(),
  validators: { onDynamic: schema },
})

export const createFormSubmitHandler =
  <TSchema extends v.GenericSchema>(schema: TSchema, onValid: (data: v.InferOutput<TSchema>) => Promise<unknown>) =>
  async ({ value, formApi }: { value: v.InferInput<TSchema>; formApi: AnyFormApi }) => {
    try {
      await onValid(v.parse(schema, value))
    } catch (error) {
      if (!isFriendlyError(error)) throw error
      formApi.setErrorMap({
        onDynamic: {
          form: error.detail ? `${error.title}. ${error.detail}` : error.title,
          fields: Object.fromEntries(Object.entries(error.fieldErrors).map(([name, messages]) => [name, messages[0]])),
        },
      })
    }
  }
