package integrations.dbgraph.dto

/**
 * author : Aravind#
 * date : 16 Sept 2022
 * desc : DTO class for each entity
 */
class DataDTO {

  private var _entityName : String as EntityName
  private var _type : String as EntityType
  private var _fields : LinkedList<DBFieldPropertiesDTO> as EntityFields
  private var _status : boolean as Status = true
  private var _message : String as Message = null

}
