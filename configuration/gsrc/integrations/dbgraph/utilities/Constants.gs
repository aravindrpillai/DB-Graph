package integrations.dbgraph.utilities

/**
 * author : Aravind
 * date : 16 Sept 2022
 * Class to keep all constants for DB Graph
 */
class Constants {

  private final static var _ignoredFieldTypes : List<String> as IGNORED_FIELD_TYPES = {
      "util.List", "lang.Class", "entity.IEntityType", "assignment.Assignee", "assignment.Assignee", "core.Bean",
      "core.Bundle", "validation.ValidationResult", "PublicActivityFinder", "EntityTypeReference","extension.IClaimExtensions",
      "EntityPropertyInfoReference", "DynamicEntityPropertyInfoReference","util.Collection", "database.IQueryBeanResult",
      ".Global", "gw.api.address.CCAddressOwner","gw.api.claim.PublicClaimFinder","gw.api.financials.CheckCreator",
      "gw.api.address.SimpleAddressOwner","gw.api.financials.IMoney","gw.api.address.CheckAddressOwner"
  }

  private final static var _ignoredFields : List<String> as IGNORED_FIELDS = {
      "Fields", "Changed", "ChangedFields", "DisplayName",
      "ChangedProperties", "NewlyImported", "New", "_EVENT", "CreateUser", "UpdateUser"
  }

}