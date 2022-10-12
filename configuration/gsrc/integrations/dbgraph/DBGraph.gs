package integrations.dbgraph

uses gw.api.json.JsonConfigAccess
uses gw.api.json.JsonObject
uses gw.api.json.mapping.TransformResult
uses gw.lang.reflect.IPropertyInfo
uses gw.lang.reflect.IType
uses gw.xml.ws.annotation.WsiWebService
uses integrations.dbgraph.dto.DBFieldPropertiesDTO
uses integrations.dbgraph.dto.DataDTO
uses integrations.dbgraph.utilities.Constants
uses integrations.dbgraph.utilities.DBFieldDataTypesEnum
uses org.apache.log4j.Logger

/**
 * author : Aravind
 * date : 16 Sept 2022
 * desc : Main class for building the DB mapping
 */
@WsiWebService
class DBGraph {

  static final var _logger = Logger.getLogger(DBGraph)
  private var _relatedEntities = new HashSet<String>()
  private var _thisEntityBean : IType

  /**
   * Webservic ehandler function
   * @param body
   * @return
   */
  function getTableInfo(body : JsonObject) : TransformResult {
    var requestDTO = jsonschema.datagraph.Request.v1_0.Request.wrap(body)
    _logger.info("Requesting info for table : " + requestDTO.tableName)
    var dataDTO = getTableInfoAsDTO(requestDTO.tableName)
    var jsonResponseMapper = JsonConfigAccess.getMapper("datagraph.Response-1.0", "Response")
    _logger.info("done processing rest service request. sending response..")
    return jsonResponseMapper.transformObject(dataDTO)
  }

  /**
   * Function to get the information as DTO
   * @param entityName
   * @return
   */
  function getTableInfoAsDTO(entityName : String) : DataDTO {
    var dataDTO = new DataDTO()
    try {
      _logger.info("Requesting info for table : " + entityName)
      var entityFullName = gw.lang.reflect.TypeSystem.getByFullName("entity." + entityName.remove("[]")).Name
      _thisEntityBean = gw.lang.reflect.TypeSystem.TypeLoader.getType(entityFullName)

      dataDTO.EntityName = entityFullName
      dataDTO.EntityType = _thisEntityBean.TypeInfo.Name
      dataDTO.EntityFields = Fields
    } catch (e : Exception) {
      dataDTO.Status = false
      dataDTO.Message = e.Message
      _logger.error(e.StackTraceAsString)
    }
    return dataDTO
  }

  /**
   * Function to return the field details
   *
   * @param entityBean
   * @return
   */
  private property get Fields() : LinkedList<DBFieldPropertiesDTO> {
    var fields = _thisEntityBean.TypeInfo.Properties.toTypedArray().toList()
    var returnFields = new LinkedList<DBFieldPropertiesDTO>()
    var prop : DBFieldPropertiesDTO
    foreach (field in fields) {
      if (shouldIgnoreThisField(field)) {
        continue
      }
      if (field.Type.Name.containsIgnoreCase("entity.")) {
        _relatedEntities.add(field.Type.Name.remove("entity.").remove("[]"))
      }
      prop = new DBFieldPropertiesDTO()
      prop.Type = getFieldDataType(field)
      prop.IsThisColumnAReference = checkIfColumnIsAReference(prop.Type)
      prop.TypeAsString = field.Type.Name
      prop.Private = field.Private
      prop.Required = field.PresentationInfo.Required

      prop.Name = field.Name
      if(prop.IsThisColumnAReference){
        prop.Name = field.Name+"("+prop.TypeAsString.remove("entity.")+")"
        prop.ReferenceName = prop.TypeAsString.remove("entity.")
      }
      returnFields.add(prop)
    }
    returnFields.addAll(IndirectlyRelatedEntities)
    return returnFields
  }


  /**
   * Function to check if this column is any sort of dtata reference
   *
   * @param type
   * @return
   */
  private function checkIfColumnIsAReference(type : DBFieldDataTypesEnum) : boolean {
    var interestedTypes = {
        DBFieldDataTypesEnum.FORIEGN_KEY,
        DBFieldDataTypesEnum.ARRAY,
        DBFieldDataTypesEnum.EDGE_FOREIGN_KEY,
        DBFieldDataTypesEnum.INDIRECT_FORIEGN_KEY
    }
    return interestedTypes.contains(type)
  }


  /**
   * Function to get the field type
   *
   * @param field
   * @return
   */
  private function getFieldDataType(field : IPropertyInfo) : DBFieldDataTypesEnum {
    var type = field.Type.Name
    switch (true) {
      case type.containsIgnoreCase("entity.") and type.containsIgnoreCase("[]"):
        return DBFieldDataTypesEnum.ARRAY
      case type.containsIgnoreCase("entity."):
        return DBFieldDataTypesEnum.FORIEGN_KEY
      case type.containsIgnoreCase("typekey."):
        return DBFieldDataTypesEnum.TYPEKEY
      case type.containsIgnoreCase("java.lang.String"):
        return DBFieldDataTypesEnum.VARCHAR
      case type.containsIgnoreCase("int"):
      case type.containsIgnoreCase("java.lang.Integer"):
        return DBFieldDataTypesEnum.INTEGER
      case type.containsIgnoreCase("java.util.Date"):
        return DBFieldDataTypesEnum.DATE
      case type.containsIgnoreCase("java.lang.Long"):
        return DBFieldDataTypesEnum.LONG
      case type.containsIgnoreCase("BigDecimal"):
        return DBFieldDataTypesEnum.BIG_DECIMAL
      case type.containsIgnoreCase("CurrencyAmount"):
        return DBFieldDataTypesEnum.CURRENCY_AMOUNT
      case type.containsIgnoreCase("SpatialPoint"):
        return DBFieldDataTypesEnum.SPATIAL_POINTS
      case type.containsIgnoreCase("boolean"):
        return DBFieldDataTypesEnum.BIT
      case field.Name == "ID":
        return DBFieldDataTypesEnum.PRIMARY_KEY
      default:
        return DBFieldDataTypesEnum.UNKNOWN
    }
  }

  /**
   * Function to check if the field is of any interest
   *
   * @param fieldName
   * @param fieldType
   * @return
   */
  private function shouldIgnoreThisField(field : IPropertyInfo) : boolean {
    var fieldName = field.Name
    var fieldType = field.Type.Name

    var shouldRemoveField = false
    foreach (ignoredFieldType in Constants.IGNORED_FIELD_TYPES) {
      if (fieldType.containsIgnoreCase(ignoredFieldType)) {
        shouldRemoveField = true
        break
      }
    }
    if (not shouldRemoveField) {
      foreach (ignoredFieldName in Constants.IGNORED_FIELDS) {
        if (fieldName.containsIgnoreCase(ignoredFieldName)) {
          shouldRemoveField = true
          break
        }
      }
    }

    return shouldRemoveField
  }

  /**
   * Function to derive all entities which doest have a reverse relation.
   */
  private property get IndirectlyRelatedEntities() : List<DBFieldPropertiesDTO> {
    var allEntities = Utility.AllEntities
    print("Found " + allEntities.Count + " Entities")
    allEntities.removeAll(_relatedEntities)
    allEntities.remove(_thisEntityBean.Name.remove("entity."))

    var entityFullName : String
    var indirectlyRelatedEntities = new LinkedList<DBFieldPropertiesDTO>()
    var fieldDTO : DBFieldPropertiesDTO
    var entityBean : IType
    var field : IPropertyInfo
    foreach (entity in allEntities) {
      if (entity.contains(".")) {
        entity = entity.split("\\.")[0]
      }
      entityFullName = gw.lang.reflect.TypeSystem.getByFullName("entity." + entity).Name
      entityBean = gw.lang.reflect.TypeSystem.TypeLoader.getType(entityFullName)

      field = entityBean.TypeInfo.Properties.toTypedArray().firstWhere(\elt1 -> elt1.Type.Name.containsIgnoreCase(_thisEntityBean.Name))
      if (field != null) {
        fieldDTO = new DBFieldPropertiesDTO()
        fieldDTO.Name = entity
        fieldDTO.ReferenceName = entity
        fieldDTO.Type = DBFieldDataTypesEnum.INDIRECT_FORIEGN_KEY
        fieldDTO.IsThisColumnAReference = true
        fieldDTO.TypeAsString = field.Type.Name
        fieldDTO.Private = field.Private
        fieldDTO.Required = field.PresentationInfo.Required
        indirectlyRelatedEntities.add(fieldDTO)
        break
      }
    }
    return indirectlyRelatedEntities
  }

}