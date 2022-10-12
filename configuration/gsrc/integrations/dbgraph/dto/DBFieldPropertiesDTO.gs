package integrations.dbgraph.dto

uses integrations.dbgraph.utilities.DBFieldDataTypesEnum

class DBFieldPropertiesDTO {

  private var _name : String as Name
  private var _referenceName : String as ReferenceName
  private var _type : DBFieldDataTypesEnum as Type
  private var _typeAsString : String as TypeAsString
  private var _isPrivate : Boolean as Private = false
  private var _isRequired : Boolean as Required = false
  private var _isThisColumnAReference : Boolean as IsThisColumnAReference = false

}