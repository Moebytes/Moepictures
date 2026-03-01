/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import functions from "./Functions"

const quadVert = `
precision mediump float;

attribute vec2 a_pos;
varying vec2 v_tex_pos;

void main() {
    v_tex_pos = a_pos;
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);
}
`

const scaleFrag = `
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_size;
varying vec2 v_tex_pos;

vec4 interp(const vec2 uv) {
    vec2 px = 1.0 / u_size;
    vec2 vc = (floor(uv * u_size)) * px;
    vec2 f = fract(uv * u_size);
    vec4 tl = texture2D(u_texture, vc);
    vec4 tr = texture2D(u_texture, vc + vec2(px.x, 0));
    vec4 bl = texture2D(u_texture, vc + vec2(0, px.y));
    vec4 br = texture2D(u_texture, vc + px);
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
}

void main() {
    gl_FragColor = interp(1.0 - v_tex_pos);
    //gl_FragColor = texture2D(u_texture, 1.0 - v_tex_pos);
}
`

const lumFrag = `
precision mediump float;

uniform sampler2D u_texture;
varying vec2 v_tex_pos;

float getLum(vec4 rgb) {
	return (rgb.r + rgb.r + rgb.g + rgb.g + rgb.g + rgb.b) / 6.0;
}

void main() {
	vec4 rgb = texture2D(u_texture, 1.0 - v_tex_pos);
	float lum = getLum(rgb);
    gl_FragColor = vec4(lum);
}
`

const pushFrag = `
precision mediump float;

uniform sampler2D u_texture;
uniform sampler2D u_textureTemp;
uniform float u_scale;
uniform float u_bold;
uniform vec2 u_pt;
varying vec2 v_tex_pos;

#define strength (min(u_scale / u_bold, 1.0))

vec4 HOOKED_tex(vec2 pos) {
    return texture2D(u_texture, pos);
}

vec4 POSTKERNEL_tex(vec2 pos) {
    return texture2D(u_textureTemp, pos);
}

vec4 getLargest(vec4 cc, vec4 lightestColor, vec4 a, vec4 b, vec4 c) {
	vec4 newColor = cc * (1.0 - strength) + ((a + b + c) / 3.0) * strength;
	if (newColor.a > lightestColor.a) {
		return newColor;
	}
	return lightestColor;
}

vec4 getRGBL(vec2 pos) {
    return vec4(HOOKED_tex(pos).rgb, POSTKERNEL_tex(pos).x);
}

float min3v(vec4 a, vec4 b, vec4 c) {
	return min(min(a.a, b.a), c.a);
}
float max3v(vec4 a, vec4 b, vec4 c) {
	return max(max(a.a, b.a), c.a);
}

void main() {
    vec2 HOOKED_pos = v_tex_pos;

	vec2 d = u_pt;
	
    vec4 cc = getRGBL(HOOKED_pos);
	vec4 t = getRGBL(HOOKED_pos + vec2(0.0, -d.y));
	vec4 tl = getRGBL(HOOKED_pos + vec2(-d.x, -d.y));
	vec4 tr = getRGBL(HOOKED_pos + vec2(d.x, -d.y));
	
	vec4 l = getRGBL(HOOKED_pos + vec2(-d.x, 0.0));
	vec4 r = getRGBL(HOOKED_pos + vec2(d.x, 0.0));
	
	vec4 b = getRGBL(HOOKED_pos + vec2(0.0, d.y));
	vec4 bl = getRGBL(HOOKED_pos + vec2(-d.x, d.y));
	vec4 br = getRGBL(HOOKED_pos + vec2(d.x, d.y));
	
	vec4 lightestColor = cc;

	//Kernel 0 and 4
	float maxDark = max3v(br, b, bl);
	float minLight = min3v(tl, t, tr);
	
	if (minLight > cc.a && minLight > maxDark) {
		lightestColor = getLargest(cc, lightestColor, tl, t, tr);
	} else {
		maxDark = max3v(tl, t, tr);
		minLight = min3v(br, b, bl);
		if (minLight > cc.a && minLight > maxDark) {
			lightestColor = getLargest(cc, lightestColor, br, b, bl);
		}
	}
	
	//Kernel 1 and 5
	maxDark = max3v(cc, l, b);
	minLight = min3v(r, t, tr);
	
	if (minLight > maxDark) {
		lightestColor = getLargest(cc, lightestColor, r, t, tr);
	} else {
		maxDark = max3v(cc, r, t);
		minLight = min3v(bl, l, b);
		if (minLight > maxDark) {
			lightestColor = getLargest(cc, lightestColor, bl, l, b);
		}
	}
	
	//Kernel 2 and 6
	maxDark = max3v(l, tl, bl);
	minLight = min3v(r, br, tr);
	
	if (minLight > cc.a && minLight > maxDark) {
		lightestColor = getLargest(cc, lightestColor, r, br, tr);
	} else {
		maxDark = max3v(r, br, tr);
		minLight = min3v(l, tl, bl);
		if (minLight > cc.a && minLight > maxDark) {
			lightestColor = getLargest(cc, lightestColor, l, tl, bl);
		}
	}
	
	//Kernel 3 and 7
	maxDark = max3v(cc, l, t);
	minLight = min3v(r, br, b);
	
	if (minLight > maxDark) {
		lightestColor = getLargest(cc, lightestColor, r, br, b);
	} else {
		maxDark = max3v(cc, r, b);
		minLight = min3v(t, l, tl);
		if (minLight > maxDark) {
			lightestColor = getLargest(cc, lightestColor, t, l, tl);
		}
    }
    
    gl_FragColor = lightestColor;
}
`

const gradFrag = `
precision mediump float;

uniform sampler2D u_texture;
uniform sampler2D u_textureTemp;
uniform vec2 u_pt;
varying vec2 v_tex_pos;

vec4 HOOKED_tex(vec2 pos) {
    return texture2D(u_texture, 1.0 - pos);
}

vec4 POSTKERNEL_tex(vec2 pos) {
    return texture2D(u_textureTemp, 1.0 - pos);
}

vec4 getRGBL(vec2 pos) {
    return vec4(HOOKED_tex(pos).rgb, POSTKERNEL_tex(pos).x);
}

void main() {
    vec2 HOOKED_pos = v_tex_pos;
    
	vec2 d = u_pt;
	
	//[tl  t tr]
	//[ l cc  r]
	//[bl  b br]
    vec4 cc = getRGBL(HOOKED_pos);
	vec4 t = getRGBL(HOOKED_pos + vec2(0.0, -d.y));
	vec4 tl = getRGBL(HOOKED_pos + vec2(-d.x, -d.y));
	vec4 tr = getRGBL(HOOKED_pos + vec2(d.x, -d.y));
	
	vec4 l = getRGBL(HOOKED_pos + vec2(-d.x, 0.0));
	vec4 r = getRGBL(HOOKED_pos + vec2(d.x, 0.0));
	
	vec4 b = getRGBL(HOOKED_pos + vec2(0.0, d.y));
	vec4 bl = getRGBL(HOOKED_pos + vec2(-d.x, d.y));
	vec4 br = getRGBL(HOOKED_pos + vec2(d.x, d.y));
	
	//Horizontal Gradient
	//[-1  0  1]
	//[-2  0  2]
	//[-1  0  1]
	float xgrad = (-tl.a + tr.a - l.a - l.a + r.a + r.a - bl.a + br.a);
	
	//Vertical Gradient
	//[-1 -2 -1]
	//[ 0  0  0]
	//[ 1  2  1]
    float ygrad = (-tl.a - t.a - t.a - tr.a + bl.a + b.a + b.a + br.a);
    
    gl_FragColor = vec4(1.0 - clamp(sqrt(xgrad * xgrad + ygrad * ygrad), 0.0, 1.0));
}
`

const finalFrag = `
precision mediump float;

uniform sampler2D u_texture;
uniform sampler2D u_textureTemp;
uniform vec2 u_pt;
uniform float u_scale;
uniform float u_blur;
varying vec2 v_tex_pos;

#define strength (min(u_scale / u_blur, 1.0))

vec4 HOOKED_tex(vec2 pos) {
    return texture2D(u_texture, vec2(pos.x, 1.0 - pos.y));
}

vec4 POSTKERNEL_tex(vec2 pos) {
    return texture2D(u_textureTemp, vec2(pos.x, 1.0 - pos.y));
}

vec4 getAverage(vec4 cc, vec4 a, vec4 b, vec4 c) {
	return cc * (1.0 - strength) + ((a + b + c) / 3.0) * strength;
}

vec4 getRGBL(vec2 pos) {
    return vec4(HOOKED_tex(pos).rgb, POSTKERNEL_tex(pos).x);
}

float min3v(vec4 a, vec4 b, vec4 c) {
	return min(min(a.a, b.a), c.a);
}
float max3v(vec4 a, vec4 b, vec4 c) {
	return max(max(a.a, b.a), c.a);
}

void main() {
    vec2 HOOKED_pos = v_tex_pos;
    
	vec2 d = u_pt;
	
    vec4 cc = getRGBL(HOOKED_pos);
	vec4 t = getRGBL(HOOKED_pos + vec2(0.0, -d.y));
	vec4 tl = getRGBL(HOOKED_pos + vec2(-d.x, -d.y));
	vec4 tr = getRGBL(HOOKED_pos + vec2(d.x, -d.y));
	
	vec4 l = getRGBL(HOOKED_pos + vec2(-d.x, 0.0));
	vec4 r = getRGBL(HOOKED_pos + vec2(d.x, 0.0));
	
	vec4 b = getRGBL(HOOKED_pos + vec2(0.0, d.y));
	vec4 bl = getRGBL(HOOKED_pos + vec2(-d.x, d.y));
	vec4 br = getRGBL(HOOKED_pos + vec2(d.x, d.y));
	
	//Kernel 0 and 4
	float maxDark = max3v(br, b, bl);
	float minLight = min3v(tl, t, tr);
	
	if (minLight > cc.a && minLight > maxDark) {
        gl_FragColor = getAverage(cc, tl, t, tr);
        return;
	} else {
		maxDark = max3v(tl, t, tr);
		minLight = min3v(br, b, bl);
		if (minLight > cc.a && minLight > maxDark) {
            gl_FragColor = getAverage(cc, br, b, bl);
            return;
		}
	}
	
	//Kernel 1 and 5
	maxDark = max3v(cc, l, b);
	minLight = min3v(r, t, tr);
	
	if (minLight > maxDark) {
        gl_FragColor = getAverage(cc, r, t, tr);
        return;
	} else {
		maxDark = max3v(cc, r, t);
		minLight = min3v(bl, l, b);
		if (minLight > maxDark) {
            gl_FragColor = getAverage(cc, bl, l, b);
            return;
		}
	}
	
	//Kernel 2 and 6
	maxDark = max3v(l, tl, bl);
	minLight = min3v(r, br, tr);
	
	if (minLight > cc.a && minLight > maxDark) {
        gl_FragColor = getAverage(cc, r, br, tr);
        return;
	} else {
		maxDark = max3v(r, br, tr);
		minLight = min3v(l, tl, bl);
		if (minLight > cc.a && minLight > maxDark) {
            gl_FragColor = getAverage(cc, l, tl, bl);
            return;
		}
	}
	
	//Kernel 3 and 7
	maxDark = max3v(cc, l, t);
	minLight = min3v(r, br, b);
	
	if (minLight > maxDark) {
        gl_FragColor = getAverage(cc, r, br, b);
        return;
	} else {
		maxDark = max3v(cc, r, b);
		minLight = min3v(t, l, tl);
		if (minLight > maxDark) {
            gl_FragColor = getAverage(cc, t, l, tl);
            return;
		}
	}
    
    gl_FragColor = cc;
}
`

const drawFrag = `
precision mediump float;

uniform sampler2D u_texture;
uniform sampler2D u_textureOrig;
varying vec2 v_tex_pos;

void main() {
    vec4 color = texture2D(u_texture, 1.0 - v_tex_pos);
    vec4 colorOrig = texture2D(u_textureOrig, vec2(1.0 - v_tex_pos.x, v_tex_pos.y));
    gl_FragColor = vec4(color.rgb, colorOrig.a);
}
`

export default class ShaderFunctions {
    public static createShader = (gl: WebGLRenderingContext, type: GLenum, code: string) => {
        const shader = gl.createShader(type)!
        gl.shaderSource(shader, code)

        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader))
        }

        return shader
    }

    public static createProgram = (gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) => {
        const vert = this.createShader(gl, gl.VERTEX_SHADER, vertexSource)
        const frag = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)

        const program = gl.createProgram()!
        gl.attachShader(program, vert)
        gl.attachShader(program, frag)

        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program))
        }

        const wrapper = {program} as {program: WebGLProgram, [key: string]: any}

        const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
        for (let i = 0; i < numAttributes; i++) {
            const attribute = gl.getActiveAttrib(program, i)!
            wrapper[attribute.name] = gl.getAttribLocation(program, attribute.name)
        }

        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
        for (let i = 0; i < numUniforms; i++) {
            const uniform = gl.getActiveUniform(program, i)!
            wrapper[uniform.name] = gl.getUniformLocation(program, uniform.name)
        }

        return wrapper
    }

    public static createTexture = (gl: WebGLRenderingContext, param: GLint, img: TexImageSource | Uint8Array,
        width: number = 0, height: number = 0) => {
        const tex = gl.createTexture()!

        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param)

        if (img instanceof Uint8Array) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, img)
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        }
        gl.bindTexture(gl.TEXTURE_2D, null)
        return tex
    }

    public static createEmptyTexture = (gl: WebGLRenderingContext) => {
        const empty = new Uint8Array(gl.canvas.width * gl.canvas.height * 4)
        return this.createTexture(gl, gl.LINEAR, empty, gl.canvas.width, gl.canvas.height)
    }

    public static createBuffer = (gl: WebGLRenderingContext, data: Float32Array) => {
        var buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
        return buffer
    }

    public static bindTexture = (gl: WebGLRenderingContext, texture: WebGLTexture, unit: GLint) => {
        gl.activeTexture(gl.TEXTURE0 + unit)
        gl.bindTexture(gl.TEXTURE_2D, texture)
    }

    public static bindAttribute = (gl: WebGLRenderingContext, buffer: WebGLBuffer, attribute: GLuint, numComponents: GLuint) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.enableVertexAttribArray(attribute)
        gl.vertexAttribPointer(attribute, numComponents, gl.FLOAT, false, 0, 0)
    }

    public static bindFramebuffer = (gl: WebGLRenderingContext, framebuffer: WebGLFramebuffer | null, texture?: WebGLTexture) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
        if (texture) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
    }

    public static anime4kUpscale = async (image: string, scale = 2.0, bold = 8.0, blur = 1.0) => {
        const img = await functions.image.createImage(image)
        if (Math.max(img.width, img.height) > 1000) return ""

        const canvas = document.createElement("canvas")
        const gl = canvas.getContext("webgl")!
        gl.canvas.width = img.width * scale
        gl.canvas.height = img.height * scale

        const inputTex = this.createTexture(gl, gl.LINEAR, img)
        const quadBuffer = this.createBuffer(gl, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]))!
        const framebuffer = gl.createFramebuffer()

        const scaleTexture = this.createEmptyTexture(gl)
        const tempTexture = this.createEmptyTexture(gl)
        const tempTexture2 = this.createEmptyTexture(gl)
        const tempTexture3 = this.createEmptyTexture(gl)

        const scaleProgram = this.createProgram(gl, quadVert, scaleFrag)
        const lumProgram = this.createProgram(gl, quadVert, lumFrag)
        const pushProgram = this.createProgram(gl, quadVert, pushFrag)
        const gradProgram = this.createProgram(gl, quadVert, gradFrag)
        const finalProgram = this.createProgram(gl, quadVert, finalFrag)
        const drawProgram = this.createProgram(gl, quadVert, drawFrag)

        gl.disable(gl.DEPTH_TEST)
        gl.disable(gl.STENCIL_TEST)
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        this.bindFramebuffer(gl, framebuffer, scaleTexture)
        gl.useProgram(scaleProgram.program)
        this.bindAttribute(gl, quadBuffer, scaleProgram.a_pos, 2)
        this.bindTexture(gl, inputTex, 0)
        gl.uniform1i(scaleProgram.u_texture, 0)
        gl.uniform2f(scaleProgram.u_size, img.width, img.height)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        this.bindFramebuffer(gl, framebuffer, tempTexture)
        gl.useProgram(lumProgram.program)
        this.bindAttribute(gl, quadBuffer, lumProgram.a_pos, 2)
        this.bindTexture(gl, scaleTexture, 0)
        gl.uniform1i(lumProgram.u_texture, 0)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        this.bindFramebuffer(gl, framebuffer, tempTexture2)
        gl.useProgram(pushProgram.program)
        this.bindAttribute(gl, quadBuffer, pushProgram.a_pos, 2)
        this.bindTexture(gl, scaleTexture, 0)
        this.bindTexture(gl, tempTexture, 1)
        gl.uniform1i(pushProgram.u_texture, 0)
        gl.uniform1i(pushProgram.u_textureTemp, 1)
        gl.uniform1f(pushProgram.u_scale, gl.canvas.width / img.width)
        gl.uniform2f(pushProgram.u_pt, 1.0 / gl.canvas.width, 1.0 / gl.canvas.height)
        gl.uniform1f(pushProgram.u_bold, bold)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        this.bindFramebuffer(gl, framebuffer, tempTexture)
        gl.useProgram(lumProgram.program)
        this.bindAttribute(gl, quadBuffer, lumProgram.a_pos, 2)
        this.bindTexture(gl, tempTexture2, 0)
        gl.uniform1i(lumProgram.u_texture, 0)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        this.bindFramebuffer(gl, framebuffer, tempTexture3)
        gl.useProgram(gradProgram.program)
        this.bindAttribute(gl, quadBuffer, gradProgram.a_pos, 2)
        this.bindTexture(gl, tempTexture2, 0)
        this.bindTexture(gl, tempTexture, 1)
        gl.uniform1i(gradProgram.u_texture, 0)
        gl.uniform1i(gradProgram.u_textureTemp, 1)
        gl.uniform2f(gradProgram.u_pt, 1.0 / gl.canvas.width, 1.0 / gl.canvas.height)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        this.bindFramebuffer(gl, framebuffer, tempTexture)
        gl.useProgram(finalProgram.program)
        this.bindAttribute(gl, quadBuffer, finalProgram.a_pos, 2)
        this.bindTexture(gl, tempTexture2, 0)
        this.bindTexture(gl, tempTexture3, 1)
        gl.uniform1i(finalProgram.u_texture, 0)
        gl.uniform1i(finalProgram.u_textureTemp, 1)
        gl.uniform1f(finalProgram.u_scale, gl.canvas.width / img.width)
        gl.uniform2f(finalProgram.u_pt, 1.0 / gl.canvas.width, 1.0 / gl.canvas.height)
        gl.uniform1f(finalProgram.u_blur, blur)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        this.bindFramebuffer(gl, null)
        gl.useProgram(drawProgram.program)
        this.bindAttribute(gl, quadBuffer, drawProgram.a_pos, 2)
        this.bindTexture(gl, tempTexture, 0)
        this.bindTexture(gl, inputTex, 1)
        gl.uniform1i(drawProgram.u_texture, 0)
        gl.uniform1i(drawProgram.u_textureOrig, 1)
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        return canvas.toDataURL("image/png")
    }
}