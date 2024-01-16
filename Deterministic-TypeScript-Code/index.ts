import fs from 'fs';

interface Attribute {
  uuid: string;
  name: string;
  // other attribute properties
}

interface ClassReference {
  uuid: string;
  min: number | null;
  max: number | null;
}

interface Role {
  uuid: string;
  class_references: ClassReference[];
}

interface RelationClass {
  uuid: string;
  name: string;
  attributes: Attribute[];
  role_from: string;
  role_to: string;
  roles: Role[];
}

interface Class {
  uuid: string;
  name: string;
  attributes: Attribute[];
}

interface Metamodel {
  uuid: string;
  name: string;
  classes: Class[];
  relationclasses: RelationClass[];
}

const filename = 'Statechange';
const metamodel: Metamodel = JSON.parse(fs.readFileSync('metamodels/' + filename +  '.json', 'utf8'));

let plantUML = '@startuml\n';

// Function to format names by removing spaces and brackets
function formatName(name: string): string {
  return name.replace(/[\s\(\)\[\]]+/g, '');
}

// Create PlantUML classes with formatted names
metamodel.classes.forEach(cls => {
  plantUML += `class ${formatName(cls.name)} {\n`;
  cls.attributes.forEach(attr => {
    plantUML += `  ${formatName(attr.name)}\n`;
  });
  plantUML += '}\n';
});

// Helper function to format cardinality
function formatCardinality(min: number | null, max: number | null): string {
  const formattedMin = min === null ? '0' : min.toString();
  const formattedMax = max === null ? '*' : max.toString();
  return formattedMin + '..' + formattedMax;
}

// Create PlantUML relations with cardinalities and formatted names
metamodel.relationclasses.forEach(relation => {
  const roleFrom = relation.roles.find(role => role.uuid === relation.role_from);
  const roleTo = relation.roles.find(role => role.uuid === relation.role_to);

  if (roleFrom && roleTo) {
    roleFrom.class_references.forEach(fromRef => {
      roleTo.class_references.forEach(toRef => {
        const sourceClass = metamodel.classes.find(cls => cls.uuid === fromRef.uuid);
        const targetClass = metamodel.classes.find(cls => cls.uuid === toRef.uuid);

        if (sourceClass && targetClass) {
          const sourceCardinality = formatCardinality(fromRef.min, fromRef.max);
          const targetCardinality = formatCardinality(toRef.min, toRef.max);
          plantUML += `${formatName(sourceClass.name)} "${sourceCardinality}" --> "${targetCardinality}" ${formatName(targetClass.name)} : ${formatName(relation.name)}\n`;
        }
      });
    });
  }
});

plantUML += '@enduml\n';

fs.writeFileSync('plantuml/' +filename +'.puml', plantUML);
console.log(plantUML);