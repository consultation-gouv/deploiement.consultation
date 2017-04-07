A.app({
  appName: "BackEnd Platform Etalab",
  menuItems: [
    {
      name: "Consultations",
      entityTypeId: "consultations",
    }
  ],
  entities: function(Fields) {
    return {
      consultations: {
        fields: {
          foo: Fields.text("Foo"),
          bar: Fields.date("Bar")
        }
      }
    }
  }
});
