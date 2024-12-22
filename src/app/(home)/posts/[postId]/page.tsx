interface PostProps {
  params: {
    postId: string;
  };
}

export default function Post({ params }: PostProps) {
  return (
    <div>
      <h1>Hello, Post! {params.postId}</h1>
    </div>
  );
}
