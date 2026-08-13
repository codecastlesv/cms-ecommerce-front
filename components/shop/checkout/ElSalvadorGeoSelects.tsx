'use client';

import {
  EL_SALVADOR_COUNTRY_ISO,
  EL_SALVADOR_COUNTRY_LABEL,
  EL_SALVADOR_GEO,
  districtsForMunicipality,
  matchDepartmentName,
  matchDistrictName,
  matchMunicipalityName,
  municipalitiesForDepartment,
} from '@/lib/constants/el-salvador-geo';

type Props = {
  department: string;
  municipality: string;
  district: string;
  onDepartmentChange: (department: string) => void;
  onMunicipalityChange: (municipality: string) => void;
  onDistrictChange: (district: string) => void;
  required?: boolean;
  showCountry?: boolean;
  inputClassName: string;
  idPrefix: string;
};

/**
 * Selects en cascada Departamento → Municipio → Distrito + País fijo El Salvador (SV).
 */
export default function ElSalvadorGeoSelects({
  department,
  municipality,
  district,
  onDepartmentChange,
  onMunicipalityChange,
  onDistrictChange,
  required = false,
  showCountry = true,
  inputClassName,
  idPrefix,
}: Props) {
  const deptValue = matchDepartmentName(department);
  const muniOptions = municipalitiesForDepartment(deptValue);
  const muniValue = matchMunicipalityName(deptValue, municipality);
  const districtOptions = districtsForMunicipality(deptValue, muniValue);
  const districtValue = matchDistrictName(deptValue, muniValue, district);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}-department`} className="block text-[13px] font-medium mb-1">
            Departamento{required ? ' *' : ''}
          </label>
          <select
            id={`${idPrefix}-department`}
            value={deptValue}
            onChange={(e) => {
              onDepartmentChange(e.target.value);
              onMunicipalityChange('');
              onDistrictChange('');
            }}
            className={inputClassName}
            required={required}
          >
            <option value="">Selecciona departamento</option>
            {EL_SALVADOR_GEO.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-municipality`} className="block text-[13px] font-medium mb-1">
            Municipio{required ? ' *' : ''}
          </label>
          <select
            id={`${idPrefix}-municipality`}
            value={muniValue}
            onChange={(e) => {
              onMunicipalityChange(e.target.value);
              onDistrictChange('');
            }}
            className={inputClassName}
            required={required}
            disabled={!deptValue}
          >
            <option value="">
              {deptValue ? 'Selecciona municipio' : 'Selecciona departamento primero'}
            </option>
            {muniOptions.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-district`} className="block text-[13px] font-medium mb-1">
          Distrito{required ? ' *' : ''}
        </label>
        <select
          id={`${idPrefix}-district`}
          value={districtValue}
          onChange={(e) => onDistrictChange(e.target.value)}
          className={inputClassName}
          required={required}
          disabled={!muniValue}
        >
          <option value="">
            {muniValue ? 'Selecciona distrito' : 'Selecciona municipio primero'}
          </option>
          {districtOptions.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      {showCountry ? (
        <div>
          <label htmlFor={`${idPrefix}-country`} className="block text-[13px] font-medium mb-1">
            País
          </label>
          <input
            id={`${idPrefix}-country`}
            type="text"
            value={EL_SALVADOR_COUNTRY_LABEL}
            disabled
            readOnly
            className={`${inputClassName} bg-slate-50 text-slate-600 cursor-not-allowed`}
            aria-describedby={`${idPrefix}-country-iso`}
          />
          <span id={`${idPrefix}-country-iso`} className="sr-only">
            Código ISO {EL_SALVADOR_COUNTRY_ISO}
          </span>
        </div>
      ) : null}
    </>
  );
}
