import {Editor} from "mem-fs-editor"
import {CodegenConfig} from "next/dist/server/config-shared"
import {GeneratorOptions} from "../../generator"
import {getCodegen, getResourceValueFromCodegen} from "../../utils/get-codegen"
import {
  addSpaceBeforeCapitals,
  camelCaseToKebabCase,
  singleCamel,
  singlePascal,
} from "../../utils/inflector"

export interface IBuilder<T, U> {
  getTemplateValues(Options: T): Promise<U>
}

export interface ResourceGeneratorOptions extends GeneratorOptions {
  ModelName: string
  ModelNames: string
  modelName: string
  modelNames: string
  rawParentModelName?: string
  parentModel?: string
  parentModels?: string
  ParentModel?: string
  ParentModels?: string
  extraArgs?: string[]
}

export interface CommonTemplateValues {
  parentModelId: string
  parentModelParam: string
  parentModel?: string
  parentModels?: string
  ParentModel?: string
  ParentModels?: string
  parentModelIdZodType?: string
  modelId: string
  modelIdZodType?: string
  modelIdParam: string
  modelName: string
  modelNames: string
  ModelName: string
  ModelNames: string
  modelNamesPath: string
  fieldTemplateValues?: {[x: string]: any}
}

export abstract class Builder<T, U> implements IBuilder<T, U> {
  public constructor(fs?: Editor) {
    this.fs = fs
  }

  abstract getTemplateValues(Options: T): Promise<U>

  public fs: Editor | undefined

  public defaultFieldConfig: CodegenConfig["fieldTypeMap"][0] = {
    component: "LabeledTextField",
    inputType: "text",
    zodType: "string",
    prismaType: "String",
  }

  public getId(input: string = "") {
    if (!input) return input
    return `${input}Id`
  }

  public getParam(input: string = "") {
    if (!input) return input
    return `[${input}]`
  }

  public getModelNamesPath(context: string | undefined, modelNames: string) {
    const kebabCaseContext = context ? `${camelCaseToKebabCase(context)}/` : ""
    const kebabCaseModelNames = camelCaseToKebabCase(modelNames)
    return kebabCaseContext + kebabCaseModelNames
  }

  // eslint-disable-next-line require-await
  public async getZodType(type: string = "") {
    return getResourceValueFromCodegen(type, "zodType")
  }

  // eslint-disable-next-line require-await
  public async getComponentForType(type: string = "") {
    return getResourceValueFromCodegen(type, "component")
  }

  // eslint-disable-next-line require-await
  public async getInputType(type: string = "") {
    return getResourceValueFromCodegen(type, "inputType")
  }

  // eslint-disable-next-line require-await
  public async getFieldTemplateValues(args: string[]) {
    const argsPromises = args.map(async (arg: string) => {
      let [valueName, typeName] = arg.split(":")
      if (typeName.includes("?")) {
        typeName = typeName.replace("?", "")
      }
      let values: {[key in string]: any} = {
        attributeName: singleCamel(valueName),
        fieldName: singleCamel(valueName),
        FieldName: singlePascal(valueName),
        field_name: addSpaceBeforeCapitals(valueName).toLocaleLowerCase(), // field name
        Field_name: singlePascal(addSpaceBeforeCapitals(valueName).toLocaleLowerCase()), // Field name
        Field_Name: singlePascal(addSpaceBeforeCapitals(valueName)), // Field Name
      }
      const codegen = (await getCodegen()).codegen
      // iterate over resources defined for this field type
      const fieldConfig = codegen.fieldTypeMap[typeName]
      values = {...this.defaultFieldConfig, ...values, ...fieldConfig}
      return values
    })
    return Promise.all(argsPromises)
  }
}
