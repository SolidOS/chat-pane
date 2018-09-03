

test.ttl : contacts-shapes.ttl ../index.ttl
			rabel ../*.ttl ../Person/0*/index.ttl -report=test.ttl -validate=contacts-shapes.ttl
all.ttl : contacts-shapes.ttl ../index.ttl
			rabel ../*.ttl ../Person/*/index.ttl ../Group/*/index.ttl -report=all.ttl -validate=contacts-shapes.ttl
errors.ttl : contacts-shapes.ttl ../index.ttl
			rabel ../*.ttl -report=errors.ttl -validate=contacts-shapes.ttl
shapes-errors.ttl:
			rabel -in=contacts-shapes.ttl -report=shapes-errors.ttl -validate=shacl-shacl.ttl
meta-errors.ttl:
			rabel -in=shacl-shacl.ttl -report=meta-errors.ttl -validate=shacl-shacl.ttl
