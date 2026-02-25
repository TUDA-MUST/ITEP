# Farfield Plot

The natural coordinte of the whole farfield calculation is the UV coordinate system where $$ -1 < u,v < 1 $$. Conversation between into polar coordinates is given by

https://de.mathworks.com/help/phased/ref/uv2azel.html

$$
\begin{align}
u &= \cos(el)\sin(az) \\
v &= \sin(el) \\

x &= u \\
y &= v \\
z &= \frac{1}{\sqrt{x^2+y^2}}
\end{align}
$$
