const days_in_month = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const month_names_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function deg2rad(degrees) {
	return degrees * Math.PI / 180;
}
function rad2deg(radians) {
	return radians / Math.PI * 180;
}
function sind(degrees) {
	return Math.sin(deg2rad(degrees));
}
function asind(degrees) {
	return rad2deg(Math.asin(degrees));
}
function cosd(degrees) {
	return Math.cos(deg2rad(degrees));
}
function acosd(degrees) {
	return rad2deg(Math.acos(degrees));
}
function power_profit(latitude, longitude, efficiency = 1) {
	// Define constants
	const solar_constant = 1361; // Solar constant in W/m^2
	const earth_mean_distance = 149.6e9; // Average distance from the Earth to the Sun in meters
	const atmosphere_thickness = 100e3; // m, thickness of the atmosphere
	const absorption_coefficient = 2e-6; // m^-1
	
	let solar_irradiance_values = [];
	let daily_energy_values = [];
	let daily_energy_horizontal_values = [];
	let day_of_year = 1;
	for(let month = 1; month <= 12; month++) {
		for(let day = 1; day <= days_in_month[month - 1]; day++) {
			let index = day_of_year - 1;
			daily_energy_values[index] = 0;
			daily_energy_horizontal_values[index] = 0;
			for(let hour = 0; hour <= 23; hour++) {
				// Calculate Local Standard Time Meridian
				let time_zone = Math.abs(Math.floor(longitude/15));
				let lstm = 15 * time_zone;
				// Calculate EoT
				let eot_correction = 360 * (day_of_year - 81) / 365;
				let eot = 9.87 * sind(eot_correction * 2) - 7.53 * cosd(eot_correction) - 1.5 * sind(eot_correction);
				// Calculate Time Correction Factor
				let tc = 4 * (longitude - lstm) * eot;
				// Calculate local solar time
				let lst = hour + tc / 60;
				// Calculate the solar hour angle (degree)
				let hour_angle = 15 * (lst - 12);
				// Calculate the solar declination angle (in radians)
				let declination = rad2deg(deg2rad(23.45) * sind(eot_correction));
				// Calculate the zenith angle (in radians)
				let elevation = asind(sind(declination) * sind(latitude) + cosd(declination) * cosd(latitude) * cosd(hour_angle));
				elevation = elevation < 0 ? 0 : elevation;
				let zenith = 90 - elevation;
				zenith = elevation > 180 ? 0 : zenith;
				// Calculate absorption
				let absorption = atmosphere_thickness * absorption_coefficient / cosd(zenith);
				// Calculate azimuth
				let azimuth = acosd((sind(declination) * cosd(latitude) - cosd(declination) * sind(latitude) * cosd(hour_angle)) / (cosd(elevation)));
				let am = 1 / cosd(zenith);
				// Estimate solar irradiance (in W/m^2)
				//let solar_irradiance = efficiency * solar_constant * cosd(zenith);// * Math.exp(-absorption);
				let solar_irradiance = efficiency * solar_constant * 0.7 ** (am ** 0.679);
				// Ensure non-negative irradiance values
				solar_irradiance = solar_irradiance < 0 ? 0 : solar_irradiance;
				let solar_irradiance_horizontal = solar_irradiance * cosd(zenith);
				// Store the result
				solar_irradiance_values[index * 24 + hour] = solar_irradiance;
				// Calculate energy for the current day (in J/m^2)
				daily_energy_values[index] += solar_irradiance / 1000;
				daily_energy_horizontal_values[index] += solar_irradiance_horizontal / 1000;
			}
			day_of_year++;
		}
	}
	return {solar_irradance: solar_irradiance_values, daily_energy: daily_energy_values, daily_energy_horizontal: daily_energy_horizontal_values};
}