package integrations.dbgraph

uses gw.api.util.ConfigAccess
uses gw.util.concurrent.LockingLazyVar
uses integrations.gunits.builder.util.GunitBuilderConstants
uses org.apache.log4j.Logger
uses java.io.File
uses java.io.FileReader
uses java.io.IOException

/**
 * date : 15 Sept 2022
 * Desc : Utility class of GUnit Builder
 */
class Utility {
  private static var _properties = LockingLazyVar.make(\-> loadProperties())
  private static var _entities = LockingLazyVar.make(\-> loadAllEntities())
  static final var _logger = Logger.getLogger(Utility)

  /**
   * Function to load the properties
   *
   * @return
   */
  private static function loadProperties() : Properties {
    var fileReader = new FileReader(GunitBuilderConstants.PROPERTY_FILE_PATH)
    var prop = new Properties()
    prop.load(fileReader)
    fileReader.close()
    return prop
  }

  /**
   * Function to load properties
   *
   * @param propName
   */
  public static function getProperty(propertyName : String) : String {
    return _properties.get().getProperty(propertyName)
  }


  /**
   * Property to get the configuration folder
   *
   * @return
   */
  static property get ConfigurationFolder() : String {
    try {
      return ConfigAccess.getModuleRoot("configuration").Path
    } catch (ex : IOException) {
      _logger.error(ex.StackTraceAsString)
      return ex.Message
    }
  }

  /**
   * Function to get all entities in this Application
   *
   * @return
   */
  static property get AllEntities() : Set<String> {
    return _entities.get()
  }

  /**
   * Function to load all entities in this Application
   *
   * @return
   */
  private static function loadAllEntities() : Set<String> {
    var extendedEntitiesFolder = ConfigurationFolder + "/config/extensions/entity".replaceAll("\\.", "/")
    var ootbEntitiesFolder = ConfigurationFolder + "/config/metadata/entity".replaceAll("\\.", "/")

    var extendedEntities = new File(extendedEntitiesFolder)
    var ootbEntities = new File(ootbEntitiesFolder)

    var allEntities = new HashSet<String>()
    for (file in extendedEntities.listFiles()) {
      if (file.File) {
        allEntities.add(file.Name.replaceFirst("[.][^.]+$", ""))
      }
    }
    for (file in ootbEntities.listFiles()) {
      if (file.File) {
        allEntities.add(file.Name.replaceFirst("[.][^.]+$", ""))
      }
    }
    return allEntities
  }


}