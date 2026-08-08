attribute vec2 reference;
attribute float birdVertex;

uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;

out vec4 vColor;
out float vZ;


void main() {
	vec4 tmpPos = texture2D(texturePosition, reference);
	vec3 pos = tmpPos.xyz;
	vec3 velocity = normalize(texture2D(textureVelocity, reference).xyz);
	vColor = vec4(0.5 * velocity + vec3(0.5), 1.0);
	
	vec3 newPosition = position;
	
	if (birdVertex == 4.0 || birdVertex == 7.0) {
		// flap wings
		newPosition.y = sin(tmpPos.w) * 5.0;
	}
	
	newPosition = mat3(modelMatrix) * newPosition;
	
	velocity.z *= -1.0;
	float xz = length(velocity.xz);
	float x = sqrt(1.0 - velocity.y * velocity.y);
	
	float cosry = velocity.x / xz;
	float sinry = velocity.z / xz;
	
	float cosrz = x;
	float sinrz = velocity.y;
	
	mat3 maty = mat3(
		cosry, 0, -sinry,
		0, 1, 0 ,
		sinry, 0, cosry
	);
	
	mat3 matz = mat3(
		cosrz, sinrz, 0,
		-sinrz, cosrz, 0,
		0 , 0, 1
	);
	
	newPosition = maty * matz * newPosition;
	newPosition += pos;
	
	vec4 projected = projectionMatrix * viewMatrix * vec4(newPosition, 1.0);
	vZ = projected.z * 0.0005; // z/2000 OR z/far
	gl_Position = projected;
}
