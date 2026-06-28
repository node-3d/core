import type * as THREE from 'three';

type TShaderDebugRenderer = THREE.WebGLRenderer & {
	debug: THREE.WebGLRenderer['debug'] & {
		onShaderError: ((
			gl: WebGLRenderingContext,
			program: WebGLProgram,
			vertexShader: WebGLShader,
			fragmentShader: WebGLShader,
		) => void) | null;
	};
};

const debugShaders = (renderer: THREE.WebGLRenderer, isEnabled: boolean): void => {
	const debugRenderer = renderer as TShaderDebugRenderer;
	debugRenderer.debug.checkShaderErrors = isEnabled;
	
	if (!isEnabled) {
		debugRenderer.debug.onShaderError = null;
		return;
	}
	
	debugRenderer.debug.onShaderError = (gl, _program, vs, fs) => {
		const parseForErrors = (shader: WebGLShader, name: string) => {
			const errors = (gl.getShaderInfoLog(shader) || '').trim();
			const prefix = `Errors in ${name}:\n\n${errors}`;
			
			if (errors !== '') {
				const code = (gl.getShaderSource(shader) || '').replaceAll('\t', '  ');
				const lines = code.split('\n');
				let linedCode = '';
				let i = 1;
				for (const line of lines) {
					linedCode += `${i < 10 ? ' ' : ''}${i}:\t\t${line}\n`;
					i++;
				}
				
				console.error(`${prefix}\n${linedCode}`);
			}
		};
		
		parseForErrors(vs, 'Vertex Shader');
		parseForErrors(fs, 'Fragment Shader');
	};
};

export { debugShaders };
export default { debugShaders };
