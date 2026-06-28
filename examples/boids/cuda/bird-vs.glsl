attribute uint vertidx;
attribute vec4 offset;
attribute vec4 velocity;

out vec4 vColor;
out float vZ;


void main() {
	float phase = offset.w;
	vec3 newPosition = position;
	
	if (vertidx == 4U || vertidx == 7U) {
		// flap wings
		newPosition.y = sin(phase) * 5.0;
	}
	
	newPosition = mat3(modelMatrix) * newPosition;
	
	vec3 velTmp = normalize(velocity.xyz);
	vColor = vec4(0.5 * velTmp + vec3(0.5), 1.0);
	
	velTmp.z *= -1.0;
	float xz = length(velTmp.xz);
	float xyz = 1.0;
	float x = sqrt(1.0 - velTmp.y * velTmp.y);
	
	float cosry = velTmp.x / xz;
	float sinry = velTmp.z / xz;
	
	float cosrz = x / xyz;
	float sinrz = velTmp.y / xyz;
	
	mat3 maty = mat3(
		cosry, 0.0, -sinry,
		0.0, 1.0, 0.0,
		sinry, 0.0, cosry
	);
	
	mat3 matz = mat3(
		cosrz, sinrz, 0.0,
		-sinrz, cosrz, 0.0,
		0.0, 0.0, 1.0
	);
	
	newPosition = maty * matz * newPosition;
	newPosition += offset.xyz;
	
	vec4 projected = projectionMatrix * viewMatrix * vec4(newPosition, 1.0);
	vZ = projected.z * 0.0005; // z/2000 OR z/far
	gl_Position = projected;
}
