export interface ServiceMetadata {
  name: "equipo-4-mlops";
}

export interface HealthRepository {
  getServiceMetadata(): ServiceMetadata;
}

export function createHealthRepository(): HealthRepository {
  return {
    getServiceMetadata() {
      return {
        name: "equipo-4-mlops",
      };
    },
  };
}
