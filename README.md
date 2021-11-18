# csx810-P4

Project 4 for CSCI 4810: Computer Graphics Fall 2021, UGA, Dr. Hybinette

**TODO:**\
Parameterize Phong Shading?\
Record Video\
Test on Odin\
Submit on Odin\
Make Piazza post\
Piazza reply 1\
Piazza reply 2\


**T1: Fix the Light Direction on Cube**\
COMPLETED - This was a realitively simple fix once I figured out the issue. I had to normalize the normal vector
with the normalMatrix in order to make the light not rotate with the cube. Something to note is that the light does
rotate with the camera, but after discussing this with Dr. Hybinette she said that because this was not specified as
wrong or something I needed to fix, It was ok to leave it as it.\
**T2: MeshNormalMaterial**\
COMPLETED - A very simple shader that optputs a pretty result! I used the same ideology as HW7 with the ray tracer
to implement this shader. I used the normal's xyz attributes to set the RGB of the final color.\
**T3: Glow**\
COMPLETED - This shader was also a simple fix and only took me about 5 minutes to make. I approached it similarly
to the exeprimental shader, but added the normal's z direction into the calculation inorder for the glow to only
happen on the edges\
**T4: MeshToonMaterial**\
COMPLETED - This shader was the most complicated for me, but I eventually got it all working. It took a lot of
research to wrap my head around what needed to be done, and eventually through trial and error I made a loop in the
shader so that most of the info could be parameterized and controlled from the GUI controls, like the color, layer
number, and starting bound.\
**T5: Phong**\
COMPLETED - This shader's code was already completed, but I added the ability to control it from the GUI menu. This
was a pretty simple task as I had already done it for the toon shader, so I did not struggle too much with this task.\
**T6: GUI - Design & feature controls**\
COMPLETED - The GUI menu has many different controls for 5 of the shaders. I made it correctly rotate all the objects
on screen as well as change the scale of them. The toon and phong shaders have cotrols for the many different
parameters that they use. I also added GUI controls for the glow, lambert, and experimental shaders that change their
colors.\
**T7: Embellishment**\
COMPLETED - For my embellishement shader, I made a lambert shader. For this shader, I fixed the one provided
in the link on the project description. This fix took some time to figure out, but I got it working in the end. In
messing with the values in the shader, I found a way to chage the color of the shadow on the object, so I left this
feature in and made it controllable from the GUI menu.
